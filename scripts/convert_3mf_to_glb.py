#!/usr/bin/env python3
"""Convert 3MF files to GLB using Blender or Assimp.

This script also inspects the 3MF package to detect whether color/material
information exists before conversion.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import textwrap
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ThreeMFStats:
    model_files: int = 0
    objects: int = 0
    base_materials: int = 0
    color_groups: int = 0
    texture2d: int = 0
    texture2d_groups: int = 0
    composite_materials: int = 0

    @property
    def has_visual_data(self) -> bool:
        return any(
            (
                self.base_materials,
                self.color_groups,
                self.texture2d,
                self.texture2d_groups,
                self.composite_materials,
            )
        )


def parse_3mf_stats(input_path: Path) -> ThreeMFStats:
    stats = ThreeMFStats()

    with zipfile.ZipFile(input_path, "r") as package:
        model_members = [name for name in package.namelist() if name.lower().endswith(".model")]
        stats.model_files = len(model_members)

        for member in model_members:
            xml_payload = package.read(member)
            root = ET.fromstring(xml_payload)

            stats.objects += len(root.findall(".//{*}object"))
            stats.base_materials += len(root.findall(".//{*}basematerials"))
            stats.color_groups += len(root.findall(".//{*}colorgroup"))
            stats.texture2d += len(root.findall(".//{*}texture2d"))
            stats.texture2d_groups += len(root.findall(".//{*}texture2dgroup"))
            stats.composite_materials += len(root.findall(".//{*}compositematerials"))

    return stats


def print_stats(stats: ThreeMFStats) -> None:
    print("3MF inspection:")
    print(f"- model files: {stats.model_files}")
    print(f"- objects: {stats.objects}")
    print(f"- base materials: {stats.base_materials}")
    print(f"- color groups: {stats.color_groups}")
    print(f"- texture2d: {stats.texture2d}")
    print(f"- texture2d groups: {stats.texture2d_groups}")
    print(f"- composite materials: {stats.composite_materials}")
    print(f"- has visual data: {'yes' if stats.has_visual_data else 'no'}")


def run_command(command: list[str], verbose: bool) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=False,
        text=True,
        capture_output=not verbose,
    )


def convert_with_assimp(
    input_path: Path,
    output_path: Path,
    assimp_cmd: str,
    verbose: bool,
) -> bool:
    command = [assimp_cmd, "export", str(input_path), str(output_path), "-f", "glb2"]
    result = run_command(command, verbose=verbose)

    if result.returncode == 0:
        return True

    if not verbose:
        print(result.stdout.strip())
        print(result.stderr.strip())

    return False


def build_blender_script() -> str:
    return textwrap.dedent(
        """
        import bpy
        import re
        import sys
        import zipfile
        import xml.etree.ElementTree as ET

        def clear_scene():
            bpy.ops.object.select_all(action="SELECT")
            bpy.ops.object.delete(use_global=False)

        def ensure_3mf_extension():
            try:
                bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.ThreeMF_io")
            except Exception:
                pass

        def pick_3mf_import_op():
            return [
                ("import_mesh.threemf", lambda fp: bpy.ops.import_mesh.threemf(filepath=fp)),
                ("wm.threemf_import", lambda fp: bpy.ops.wm.threemf_import(filepath=fp)),
                ("import_scene.threemf", lambda fp: bpy.ops.import_scene.threemf(filepath=fp)),
            ]

        def import_3mf(path):
            last_error = None
            for name, fn in pick_3mf_import_op():
                try:
                    result = fn(path)
                    if "FINISHED" in result:
                        print("Import succeeded with", name)
                        return
                except Exception as exc:
                    last_error = exc
            raise RuntimeError(
                "3MF importer operator is not available or failed. "
                "Enable/install the 3MF Blender extension first. "
                f"Last error: {last_error}"
            )

        def parse_prusa_data(path_3mf):
            try:
                with zipfile.ZipFile(path_3mf, "r") as archive:
                    slicer_cfg = archive.read("Metadata/Slic3r_PE.config").decode(
                        "utf-8",
                        errors="replace",
                    )
                    model_cfg = archive.read("Metadata/Slic3r_PE_model.config")
            except Exception:
                return [], []

            match = re.search(r"^;\\s*extruder_colour\\s*=\\s*(.+)$", slicer_cfg, flags=re.MULTILINE)
            extruder_colors = [part.strip() for part in match.group(1).split(";") if part.strip()] if match else []

            try:
                root = ET.fromstring(model_cfg)
            except Exception:
                return extruder_colors, []

            ranges = []
            for volume in root.findall(".//volume"):
                first_id = int(volume.attrib.get("firstid", "-1"))
                last_id = int(volume.attrib.get("lastid", "-1"))
                extruder = None
                for metadata in volume.findall("metadata"):
                    if metadata.attrib.get("type") == "volume" and metadata.attrib.get("key") == "extruder":
                        extruder = int(metadata.attrib.get("value"))
                        break

                if first_id >= 0 and last_id >= first_id and extruder is not None:
                    ranges.append((first_id, last_id, extruder))

            ranges.sort(key=lambda item: item[0])
            return extruder_colors, ranges

        def srgb_to_linear(value):
            if value <= 0.04045:
                return value / 12.92
            return ((value + 0.055) / 1.055) ** 2.4

        def hex_to_linear_rgba(hex_color):
            color = hex_color.strip().lstrip("#")
            if len(color) != 6:
                return (0.8, 0.8, 0.8, 1.0)

            red = int(color[0:2], 16) / 255.0
            green = int(color[2:4], 16) / 255.0
            blue = int(color[4:6], 16) / 255.0
            return (
                srgb_to_linear(red),
                srgb_to_linear(green),
                srgb_to_linear(blue),
                1.0,
            )

        def create_flat_material(name, hex_color):
            material = bpy.data.materials.new(name=name)
            material.use_nodes = True
            rgba = hex_to_linear_rgba(hex_color)

            nodes = material.node_tree.nodes
            links = material.node_tree.links
            nodes.clear()

            output = nodes.new(type="ShaderNodeOutputMaterial")
            principled = nodes.new(type="ShaderNodeBsdfPrincipled")
            principled.inputs["Base Color"].default_value = rgba
            principled.inputs["Roughness"].default_value = 0.45

            if "Specular IOR Level" in principled.inputs:
                principled.inputs["Specular IOR Level"].default_value = 0.35
            elif "Specular" in principled.inputs:
                principled.inputs["Specular"].default_value = 0.35

            links.new(principled.outputs["BSDF"], output.inputs["Surface"])
            material.diffuse_color = rgba
            return material

        def pick_largest_mesh_object():
            meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
            if not meshes:
                return None
            return max(meshes, key=lambda obj: len(obj.data.polygons))

        def extract_hex_colors_from_material_names(materials):
            colors = []
            for material in materials:
                if not material:
                    continue
                match = re.search(r"#([0-9A-Fa-f]{6})", material.name or "")
                if match:
                    colors.append("#" + match.group(1).upper())
            return colors

        def apply_prusa_ranges(mesh_object, extruder_colors, ranges):
            if not mesh_object or not ranges:
                return False

            mesh = mesh_object.data
            polygon_count = len(mesh.polygons)
            max_last = max(last_id for _, last_id, _ in ranges)

            if polygon_count <= max_last:
                print(
                    "Prusa range mapping skipped: polygon count mismatch "
                    f"(polygons={polygon_count}, max_last={max_last})"
                )
                return False

            fallback_colors = extract_hex_colors_from_material_names(mesh.materials)
            mesh.materials.clear()

            used_extruders = sorted({extruder for _, _, extruder in ranges})
            extruder_to_material_index = {}

            for extruder in used_extruders:
                color = None
                if 0 < extruder <= len(extruder_colors):
                    color = extruder_colors[extruder - 1]
                elif 0 < extruder <= len(fallback_colors):
                    color = fallback_colors[extruder - 1]
                else:
                    color = "#CCCCCC"

                material = create_flat_material(f"Extruder_{extruder}_{color}", color)
                mesh.materials.append(material)
                extruder_to_material_index[extruder] = len(mesh.materials) - 1

            polygons = mesh.polygons
            for first_id, last_id, extruder in ranges:
                material_index = extruder_to_material_index.get(extruder)
                if material_index is None:
                    continue
                for polygon_index in range(first_id, last_id + 1):
                    polygons[polygon_index].material_index = material_index

            print("Applied Prusa color mapping:", extruder_to_material_index)
            return True

        def assign_vertex_color_material(mesh_object):
            if mesh_object.type != "MESH":
                return

            if mesh_object.material_slots:
                return

            mesh = mesh_object.data
            color_attributes = getattr(mesh, "color_attributes", None)
            if not color_attributes or len(color_attributes) == 0:
                return

            color_attr = color_attributes[0].name

            material = bpy.data.materials.new(name=f"{mesh_object.name}_auto_vcol")
            material.use_nodes = True

            nodes = material.node_tree.nodes
            links = material.node_tree.links
            nodes.clear()

            output = nodes.new(type="ShaderNodeOutputMaterial")
            principled = nodes.new(type="ShaderNodeBsdfPrincipled")
            attr = nodes.new(type="ShaderNodeAttribute")
            attr.attribute_name = color_attr

            links.new(attr.outputs["Color"], principled.inputs["Base Color"])
            links.new(principled.outputs["BSDF"], output.inputs["Surface"])

            mesh_object.data.materials.append(material)

        def main(input_path, output_path):
            clear_scene()
            ensure_3mf_extension()
            extruder_colors, ranges = parse_prusa_data(input_path)
            import_3mf(input_path)

            largest_mesh = pick_largest_mesh_object()
            mapped = apply_prusa_ranges(largest_mesh, extruder_colors, ranges)

            if not mapped:
                for obj in bpy.context.scene.objects:
                    assign_vertex_color_material(obj)

            bpy.ops.export_scene.gltf(
                filepath=output_path,
                export_format="GLB",
                export_materials="EXPORT",
            )

        args = sys.argv
        if "--" not in args:
            raise SystemExit("Usage: blender ... -- <input.3mf> <output.glb>")

        payload = args[args.index("--") + 1 :]
        if len(payload) != 2:
            raise SystemExit("Expected exactly 2 args: <input.3mf> <output.glb>")

        main(payload[0], payload[1])
        """
    )


def convert_with_blender(
    input_path: Path,
    output_path: Path,
    blender_cmd: str,
    verbose: bool,
) -> bool:
    script_source = build_blender_script()

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as temp_script:
        temp_script.write(script_source)
        script_path = Path(temp_script.name)

    command = [
        blender_cmd,
        "--background",
        "--python",
        str(script_path),
        "--",
        str(input_path),
        str(output_path),
    ]

    result = run_command(command, verbose=verbose)

    try:
        script_path.unlink(missing_ok=True)
    except OSError:
        pass

    if result.returncode == 0:
        return True

    if not verbose:
        print(result.stdout.strip())
        print(result.stderr.strip())

    return False


def ensure_input_file(input_path: Path) -> None:
    if not input_path.exists():
        raise FileNotFoundError(f"Input file does not exist: {input_path}")
    if input_path.suffix.lower() != ".3mf":
        raise ValueError("Input file must be a .3mf file")


def resolve_engine_order(engine: str) -> list[str]:
    if engine == "assimp":
        return ["assimp"]
    if engine == "blender":
        return ["blender"]
    return ["blender", "assimp"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert 3MF to GLB with automatic fallback engines.",
    )
    parser.add_argument("input", type=Path, help="Source 3MF file path")
    parser.add_argument("output", type=Path, nargs="?", help="Target GLB file path")
    parser.add_argument(
        "--engine",
        choices=("auto", "blender", "assimp"),
        default="auto",
        help="Conversion engine order (default: auto = blender -> assimp)",
    )
    parser.add_argument(
        "--blender-cmd",
        default="blender",
        help="Blender executable name/path (default: blender)",
    )
    parser.add_argument(
        "--assimp-cmd",
        default="assimp",
        help="Assimp executable name/path (default: assimp)",
    )
    parser.add_argument(
        "--inspect-only",
        action="store_true",
        help="Only inspect 3MF visual metadata and exit",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite output if it already exists",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print raw command output",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = args.input.resolve()

    try:
        ensure_input_file(input_path)
    except (FileNotFoundError, ValueError) as error:
        print(f"Error: {error}")
        return 1

    try:
        stats = parse_3mf_stats(input_path)
        print_stats(stats)
    except (zipfile.BadZipFile, ET.ParseError, OSError) as error:
        print(f"Warning: Unable to inspect 3MF metadata ({error})")
        stats = None

    if args.inspect_only:
        return 0

    output_path = args.output
    if output_path is None:
        output_path = input_path.with_suffix(".glb")
    output_path = output_path.resolve()

    if output_path.exists() and not args.force:
        print(f"Error: Output already exists: {output_path}. Use --force to overwrite.")
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)

    engines = resolve_engine_order(args.engine)
    attempted: list[str] = []

    for engine in engines:
        if engine == "blender":
            if shutil.which(args.blender_cmd) is None:
                print(f"Skip blender: command not found ({args.blender_cmd})")
                continue

            attempted.append("blender")
            print("Trying conversion with Blender...")
            if convert_with_blender(input_path, output_path, args.blender_cmd, args.verbose):
                print(f"Success: {output_path}")
                if stats and not stats.has_visual_data:
                    print(
                        "Note: 3MF appears to have no explicit color/material groups; "
                        "you may need manual painting for full color fidelity."
                    )
                return 0

            print("Blender conversion failed.")
            continue

        if engine == "assimp":
            if shutil.which(args.assimp_cmd) is None:
                print(f"Skip assimp: command not found ({args.assimp_cmd})")
                continue

            attempted.append("assimp")
            print("Trying conversion with Assimp...")
            if convert_with_assimp(input_path, output_path, args.assimp_cmd, args.verbose):
                print(f"Success: {output_path}")
                if stats and not stats.has_visual_data:
                    print(
                        "Note: 3MF appears to have no explicit color/material groups; "
                        "you may need manual painting for full color fidelity."
                    )
                return 0

            print("Assimp conversion failed.")
            continue

    if not attempted:
        print("Error: No conversion engine available.")
        print("Install Blender or Assimp, then run again.")
        return 2

    print("Error: Conversion failed with all available engines.")
    return 3


if __name__ == "__main__":
    raise SystemExit(main())
