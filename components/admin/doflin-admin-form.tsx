"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { PencilSquareIcon, ShieldCheckIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";

import { RARITY_CONFIG, rarityLabel, RARITY_ORDER } from "@/lib/constants/rarity";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CollectionItemDTO, Rarity } from "@/lib/types/doflin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";

interface AdminCollectionResponse {
  status: "ok";
  items: AdminDoflinItem[];
}

interface AdminDoflinItem extends CollectionItemDTO {
  slug: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface CreateDoflinResponse {
  status: "ok" | "error";
  message?: string;
  doflin?: AdminDoflinItem;
  item?: AdminDoflinItem;
}

type VariantMode = "original" | "variant";

interface FormValues {
  name: string;
  variantMode: VariantMode;
  baseModel: string;
  variantName: string;
  series: "Animals" | "Multiverse";
  collectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
}

interface BulkValues {
  series: "Animals" | "Multiverse";
  baseModel: string;
  startCollectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
}

interface EditValues {
  name: string;
  baseModel: string;
  variantName: string;
  series: "Animals" | "Multiverse";
  collectionNumber: string;
  rarity: Rarity;
  probability: string;
  active: boolean;
  funFact: string;
}

interface DoflinAdminFormProps {
  requireToken?: boolean;
}

const INITIAL_VALUES: FormValues = {
  name: "",
  variantMode: "original",
  baseModel: "",
  variantName: "Original",
  series: "Animals",
  collectionNumber: "",
  rarity: "COMMON",
  probability: String(RARITY_CONFIG.COMMON.probability),
  active: true,
};

const INITIAL_BULK_VALUES: BulkValues = {
  series: "Animals",
  baseModel: "",
  startCollectionNumber: "",
  rarity: "COMMON",
  probability: String(RARITY_CONFIG.COMMON.probability),
  active: true,
};

const ADMIN_TOKEN_STORAGE_KEY = "doflins_admin_token";

function toSlugPreview(rawValue: string): string {
  return rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileNameToDoflinName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Doflin";
  }

  return normalized
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ── Vista previa de imagen seleccionada ──────────────────────────────────────
function useObjectUrl(file: File | null): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!file) { setSrc(null); return; }
    let active = true;
    const url = URL.createObjectURL(file);
    if (active) setSrc(url);
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);
  return src;
}

function ImagePreview({ file }: { file: File }): React.JSX.Element | null {
  const src = useObjectUrl(file);
  if (!src) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[#d8d2b4] bg-[#fafafa] p-1.5 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Vista previa" className="h-28 w-auto max-w-full object-contain rounded-lg" />
    </div>
  );
}

// ── Vista previa en catálogo ──────────────────────────────────────────────────
function CatalogCardPreview({
  name,
  rarity,
  collectionNumber,
  series,
  imageFile,
}: {
  name: string;
  rarity: string;
  collectionNumber: string;
  series: string;
  imageFile: File | null;
}): React.JSX.Element {
  const src = useObjectUrl(imageFile);

  const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.COMMON;
  const num = collectionNumber || "?";

  return (
    <div className="space-y-1.5 rounded-xl border border-[#d8d2b4] bg-[#f8f6ee] p-3">
      <p className="text-xs font-semibold text-[var(--ink-700)]">Vista previa en catálogo</p>
      <div className="flex items-start gap-3">
        {/* Tarjeta miniatura */}
        <div
          className="relative flex w-28 shrink-0 flex-col overflow-hidden rounded-xl"
          style={{
            background: `linear-gradient(145deg, ${cfg.softColor}, white)`,
            border: `2px solid ${cfg.color}50`,
          }}
        >
          {/* Badge número */}
          <div
            className="absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black leading-none text-white"
            style={{ background: cfg.color }}
          >
            {num}
          </div>
          {/* Área imagen */}
          <div className="relative w-full" style={{ aspectRatio: "1/1", background: cfg.softColor }}>
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={name} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl opacity-25">🐾</div>
            )}
          </div>
          {/* Footer */}
          <div className="px-1.5 py-1">
            <p className="truncate text-[9px] font-bold leading-tight" style={{ color: cfg.color }}>
              {name}
            </p>
            <p className="text-[7px] leading-tight opacity-60" style={{ color: cfg.color }}>
              {series} · {cfg.label}
            </p>
          </div>
        </div>
        <p className="pt-1 text-[10px] leading-relaxed text-[var(--ink-500)]">
          Vista aproximada de cómo aparecerá en el álbum del coleccionista. La imagen se actualiza al seleccionarla.
        </p>
      </div>
    </div>
  );
}

export function DoflinAdminForm({ requireToken = false }: DoflinAdminFormProps): React.JSX.Element {
  const [adminToken, setAdminToken] = useState("");
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [bulkValues, setBulkValues] = useState<BulkValues>(INITIAL_BULK_VALUES);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variantFiles, setVariantFiles] = useState<File[]>([]);
  const [showVariantUpload, setShowVariantUpload] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [isLoadingCollection, setIsLoadingCollection] = useState(true);
  const [adminItems, setAdminItems] = useState<AdminDoflinItem[]>([]);
  const [crudQuery, setCrudQuery] = useState("");
  const [editingItem, setEditingItem] = useState<AdminDoflinItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AdminDoflinItem | null>(null);
  const [pendingToggleItem, setPendingToggleItem] = useState<AdminDoflinItem | null>(null);
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [bulkStatus, setBulkStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
  } | null>(null);

  // ── CSV import state ─────────────────────────────────────────────────────────
  interface CsvRow {
    nombre: string;
    serie: "Animals" | "Multiverse";
    rareza: Rarity;
    probabilidad: string;
    numeroColeccion: string;
    modeloBase: string;
    variantName: string;
  }
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  const seriesCount = useMemo(
    () => ({
      animals: adminItems.filter((item) => item.series.toLowerCase() === "animals").length,
      multiverse: adminItems.filter((item) => item.series.toLowerCase() === "multiverse").length,
    }),
    [adminItems],
  );

  const nextCollectionBySeries = useMemo(() => {
    const maxBySeries = adminItems.reduce(
      (accumulator, item) => {
        const series = item.series === "Multiverse" ? "Multiverse" : "Animals";
        accumulator[series] = Math.max(accumulator[series], item.collectionNumber);
        return accumulator;
      },
      { Animals: 0, Multiverse: 0 },
    );

    return {
      Animals: maxBySeries.Animals + 1,
      Multiverse: maxBySeries.Multiverse + 1,
    };
  }, [adminItems]);

  const baseModelsBySeries = useMemo(() => {
    const bySeries: Record<FormValues["series"], string[]> = { Animals: [], Multiverse: [] };
    const seen: Record<FormValues["series"], Set<string>> = { Animals: new Set(), Multiverse: new Set() };

    for (const item of adminItems) {
      const series = item.series === "Multiverse" ? "Multiverse" : "Animals";
      const normalizedBase = item.baseModel.trim();
      if (!normalizedBase) {
        continue;
      }

      const slug = normalizedBase.toLowerCase();
      if (seen[series].has(slug)) {
        continue;
      }

      seen[series].add(slug);
      bySeries[series].push(normalizedBase);
    }

    bySeries.Animals.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    bySeries.Multiverse.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    return bySeries;
  }, [adminItems]);

  const availableBaseModels = useMemo(
    () => baseModelsBySeries[formValues.series],
    [baseModelsBySeries, formValues.series],
  );

  const slugPreview = useMemo(() => toSlugPreview(formValues.name), [formValues.name]);

  const variantNumberRangePreview = useMemo(() => {
    if (formValues.variantMode !== "original" || variantFiles.length === 0) {
      return null;
    }

    const parsedBaseNumber = Number.parseInt(formValues.collectionNumber, 10);
    const safeBaseNumber =
      Number.isInteger(parsedBaseNumber) && parsedBaseNumber > 0
        ? parsedBaseNumber
        : nextCollectionBySeries[formValues.series];

    return {
      from: safeBaseNumber + 1,
      to: safeBaseNumber + variantFiles.length,
    };
  }, [formValues.collectionNumber, formValues.series, formValues.variantMode, nextCollectionBySeries, variantFiles.length]);

  const isVariantBlocked = useMemo(
    () => formValues.variantMode === "variant" && (availableBaseModels.length === 0 || !formValues.baseModel.trim()),
    [availableBaseModels.length, formValues.baseModel, formValues.variantMode],
  );

  const refreshCollection = useCallback(async (): Promise<void> => {
    setIsLoadingCollection(true);

    try {
      const headers: HeadersInit = {};
      if (adminToken.trim()) {
        headers["x-admin-token"] = adminToken.trim();
      }

      const response = await fetch("/api/admin/doflins", { cache: "no-store", headers });
      if (response.status === 401) {
        setAdminItems([]);
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo cargar el catálogo actual.");
      }

      const payload = (await response.json()) as AdminCollectionResponse;
      const sorted = [...payload.items].sort((a, b) => a.collectionNumber - b.collectionNumber || a.id - b.id);
      setAdminItems(sorted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar la colección.";
      toast.error(message);
      setAdminItems([]);
    } finally {
      setIsLoadingCollection(false);
    }
  }, [adminToken]);

  useEffect(() => {
    void refreshCollection();
  }, [refreshCollection]);

  useEffect(() => {
    if (!requireToken || typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim();
    if (saved) {
      setAdminToken(saved);
    }
  }, [requireToken]);

  useEffect(() => {
    if (!requireToken || typeof window === "undefined") {
      return;
    }

    const token = adminToken.trim();
    if (!token) {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  }, [adminToken, requireToken]);

  useEffect(() => {
    setFormValues((previous) => {
      if (previous.collectionNumber.trim().length > 0) {
        return previous;
      }

      return {
        ...previous,
        collectionNumber: String(nextCollectionBySeries[previous.series]),
      };
    });
  }, [nextCollectionBySeries]);

  useEffect(() => {
    setBulkValues((previous) => {
      if (previous.startCollectionNumber.trim().length > 0) {
        return previous;
      }

      return {
        ...previous,
        startCollectionNumber: String(nextCollectionBySeries[previous.series]),
      };
    });
  }, [nextCollectionBySeries]);

  useEffect(() => {
    setFormValues((previous) => {
      if (previous.variantMode !== "variant") {
        return previous;
      }

      const seriesModels = baseModelsBySeries[previous.series];
      if (seriesModels.length === 0) {
        if (!previous.baseModel) {
          return previous;
        }

        return {
          ...previous,
          baseModel: "",
        };
      }

      if (seriesModels.includes(previous.baseModel.trim())) {
        return previous;
      }

      return {
        ...previous,
        baseModel: seriesModels[0],
      };
    });
  }, [baseModelsBySeries]);

  const onFieldChange = <T extends keyof FormValues>(field: T, value: FormValues[T]): void => {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleVariantModeChange = (mode: VariantMode): void => {
    setFormValues((previous) => {
      if (previous.variantMode === mode) {
        return previous;
      }

      if (mode === "original") {
        return {
          ...previous,
          variantMode: "original",
          baseModel: previous.baseModel.trim() || previous.name.trim(),
          variantName: "Original",
        };
      }

      return {
        ...previous,
        variantMode: "variant",
        baseModel: baseModelsBySeries[previous.series][0] ?? "",
        variantName: "",
      };
    });
    setVariantFiles([]);
    setShowVariantUpload(false);
  };

  const handleSeriesChange = (series: FormValues["series"]): void => {
    setFormValues((previous) => {
      const nextValues: FormValues = {
        ...previous,
        series,
        collectionNumber: String(nextCollectionBySeries[series]),
      };

      if (previous.variantMode === "variant") {
        const seriesModels = baseModelsBySeries[series];
        nextValues.baseModel = seriesModels.includes(previous.baseModel.trim()) ? previous.baseModel : (seriesModels[0] ?? "");
      }

      return nextValues;
    });
  };

  const onBulkFieldChange = <T extends keyof BulkValues>(field: T, value: BulkValues[T]): void => {
    setBulkValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const getAuthHeaders = useCallback((): HeadersInit => {
    if (!adminToken.trim()) {
      return {};
    }

    return {
      "x-admin-token": adminToken.trim(),
    };
  }, [adminToken]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!imageFile) {
      toast.error("Debes subir la imagen del Doflin.");
      return;
    }

    const baseCollectionNumber = Number.parseInt(formValues.collectionNumber, 10);
    if (!Number.isInteger(baseCollectionNumber) || baseCollectionNumber <= 0) {
      toast.error("El número de colección debe ser un entero positivo.");
      return;
    }

    const normalizedName = formValues.name.trim();
    const normalizedBaseModel =
      formValues.variantMode === "original" ? (formValues.baseModel.trim() || normalizedName) : formValues.baseModel.trim();
    const normalizedVariantName = formValues.variantMode === "original" ? "Original" : formValues.variantName.trim();

    if (!normalizedBaseModel) {
      toast.error("Selecciona un animal base para guardar la variante.");
      return;
    }

    if (formValues.variantMode === "variant" && !normalizedVariantName) {
      toast.error("Escribe el nombre de la variante.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", normalizedName);
    formData.set("baseModel", normalizedBaseModel);
    formData.set("variantName", normalizedVariantName);
    formData.set("series", formValues.series);
    formData.set("collectionNumber", formValues.collectionNumber.trim());
    formData.set("rarity", formValues.rarity);
    formData.set("probability", formValues.probability.trim());
    formData.set("active", String(formValues.active));

    if (adminToken.trim()) {
      formData.set("token", adminToken.trim());
    }

    if (imageFile) {
      formData.set("imageFile", imageFile);
    }

    try {
      const response = await fetch("/api/admin/doflins", {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(),
      });

      const payload = (await response.json()) as CreateDoflinResponse;

      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message || "No se pudo crear el Doflin.");
      }

      let variantSuccess = 0;
      const variantFailures: string[] = [];

      if (formValues.variantMode === "original" && variantFiles.length > 0) {
        const baseModel = normalizedBaseModel;

        for (const [index, file] of variantFiles.entries()) {
          const inferredVariantName = fileNameToDoflinName(file.name);
          const variantName = inferredVariantName || `Variante ${index + 1}`;
          const variantCreateData = new FormData();

          variantCreateData.set("name", `${baseModel} ${variantName}`.trim());
          variantCreateData.set("baseModel", baseModel);
          variantCreateData.set("variantName", variantName);
          variantCreateData.set("series", formValues.series);
          variantCreateData.set("collectionNumber", String(baseCollectionNumber + index + 1));
          variantCreateData.set("rarity", formValues.rarity);
          variantCreateData.set("probability", formValues.probability.trim());
          variantCreateData.set("active", String(formValues.active));
          variantCreateData.set("imageFile", file);

          if (adminToken.trim()) {
            variantCreateData.set("token", adminToken.trim());
          }

          try {
            const variantResponse = await fetch("/api/admin/doflins", {
              method: "POST",
              body: variantCreateData,
              headers: getAuthHeaders(),
            });

            const variantPayload = (await variantResponse.json()) as CreateDoflinResponse;
            if (!variantResponse.ok || variantPayload.status !== "ok") {
              variantFailures.push(
                `${file.name}: ${variantPayload.message || "No se pudo crear la variante."}`,
              );
              continue;
            }

            variantSuccess += 1;
          } catch (error) {
            variantFailures.push(
              `${file.name}: ${error instanceof Error ? error.message : "Error al crear variante."}`,
            );
          }
        }
      }

      if (formValues.variantMode === "original" && variantFiles.length > 0) {
        if (variantSuccess === variantFiles.length) {
          toast.success(`Doflin creado + ${variantSuccess} variante(s) guardadas.`);
        } else if (variantSuccess > 0) {
          toast.success(`Doflin creado + ${variantSuccess} variante(s). Algunas fallaron.`);
        } else {
          toast.success("Doflin base creado. No se pudieron crear variantes.");
        }

        if (variantFailures.length > 0) {
          toast.error(`Errores en variantes: ${variantFailures.slice(0, 2).join(" | ")}`);
        }
      } else {
        toast.success(payload.message || "Doflin creado correctamente.");
      }

      setFormValues((previous) => ({
        ...INITIAL_VALUES,
        series: previous.series,
        collectionNumber: "",
      }));
      setImageFile(null);
      setVariantFiles([]);
      setShowVariantUpload(false);
      await refreshCollection();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar el Doflin.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (bulkFiles.length === 0) {
      toast.error("Selecciona al menos una imagen para carga masiva.");
      return;
    }

    const startNumber = Number.parseInt(bulkValues.startCollectionNumber, 10);
    if (!Number.isInteger(startNumber) || startNumber <= 0) {
      toast.error("El número inicial de colección debe ser un entero positivo.");
      return;
    }

    setIsBulkSubmitting(true);
    setBulkStatus({
      total: bulkFiles.length,
      processed: 0,
      success: 0,
      failed: 0,
    });

    let success = 0;
    let failed = 0;
    const failedMessages: string[] = [];

    for (const [index, file] of bulkFiles.entries()) {
      const inferredName = fileNameToDoflinName(file.name);
      const baseModel = bulkValues.baseModel.trim() || inferredName;
      const variantName = bulkValues.baseModel.trim() ? inferredName : "Original";
      const formData = new FormData();
      formData.set("name", inferredName);
      formData.set("baseModel", baseModel);
      formData.set("variantName", variantName);
      formData.set("series", bulkValues.series);
      formData.set("collectionNumber", String(startNumber + index));
      formData.set("rarity", bulkValues.rarity);
      formData.set("probability", bulkValues.probability.trim());
      formData.set("active", String(bulkValues.active));
      formData.set("imageFile", file);

      if (adminToken.trim()) {
        formData.set("token", adminToken.trim());
      }

      try {
        const response = await fetch("/api/admin/doflins", {
          method: "POST",
          body: formData,
          headers: getAuthHeaders(),
        });

        const payload = (await response.json()) as CreateDoflinResponse;
        if (!response.ok || payload.status !== "ok") {
          failed += 1;
          failedMessages.push(
            `${file.name}: ${payload.message || "No se pudo crear el Doflin en carga masiva."}`,
          );
        } else {
          success += 1;
        }
      } catch (error) {
        failed += 1;
        failedMessages.push(`${file.name}: ${error instanceof Error ? error.message : "Error de red"}`);
      } finally {
        setBulkStatus({
          total: bulkFiles.length,
          processed: index + 1,
          success,
          failed,
        });
      }
    }

    if (success > 0) {
      toast.success(`Carga masiva completada. ${success} creados, ${failed} con error.`);
    } else {
      toast.error("No se pudo crear ningún Doflin en la carga masiva.");
    }

    if (failedMessages.length > 0) {
      toast.error(`Errores: ${failedMessages.slice(0, 2).join(" | ")}`);
    }

    setIsBulkSubmitting(false);
    setBulkFiles([]);
    setBulkStatus(null);
    setBulkValues((previous) => ({
      ...previous,
      startCollectionNumber: String(startNumber + success),
    }));
    await refreshCollection();
  };

  const crudItems = useMemo(() => {
    const normalizedQuery = crudQuery.trim().toLowerCase();

    return adminItems
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.baseModel.toLowerCase().includes(normalizedQuery) ||
          item.variantName.toLowerCase().includes(normalizedQuery) ||
          item.series.toLowerCase().includes(normalizedQuery) ||
          String(item.collectionNumber).includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.collectionNumber - b.collectionNumber || a.id - b.id);
  }, [adminItems, crudQuery]);

  const openEditDialog = (item: AdminDoflinItem): void => {
    setEditingItem(item);
    setEditValues({
      name: item.name,
      baseModel: item.baseModel,
      variantName: item.variantName,
      series: item.series === "Multiverse" ? "Multiverse" : "Animals",
      collectionNumber: String(item.collectionNumber),
      rarity: item.rarity,
      probability: String(item.probability),
      active: item.active,
      funFact: item.funFact ?? "",
    });
    setEditImageFile(null);
  };

  const closeEditDialog = (): void => {
    setEditingItem(null);
    setEditValues(null);
    setEditImageFile(null);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!editingItem || !editValues) {
      return;
    }

    setIsUpdating(true);

    const formData = new FormData();
    formData.set("name", editValues.name.trim());
    formData.set("baseModel", editValues.baseModel.trim());
    formData.set("variantName", editValues.variantName.trim());
    formData.set("series", editValues.series);
    formData.set("collectionNumber", editValues.collectionNumber.trim());
    formData.set("rarity", editValues.rarity);
    formData.set("probability", editValues.probability.trim());
    formData.set("active", String(editValues.active));
    formData.set("funFact", editValues.funFact.trim());

    if (adminToken.trim()) {
      formData.set("token", adminToken.trim());
    }

    if (editImageFile) {
      formData.set("imageFile", editImageFile);
    }

    try {
      const response = await fetch(`/api/admin/doflins?id=${editingItem.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message || "No se pudo actualizar el Doflin.");
      }

      toast.success(payload.message || "Doflin actualizado.");
      closeEditDialog();
      await refreshCollection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el Doflin.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (item: AdminDoflinItem): Promise<void> => {
    setToggleLoadingId(item.id);

    try {
      const response = await fetch(`/api/admin/doflins?id=${item.id}`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !item.active,
        }),
      });

      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message || "No se pudo cambiar el estado.");
      }

      toast.success(payload.message || "Estado actualizado.");
      setPendingToggleItem(null);
      await refreshCollection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deletingItem) {
      return;
    }

    setDeleteLoadingId(deletingItem.id);

    try {
      const response = await fetch(`/api/admin/doflins?id=${deletingItem.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message || "No se pudo eliminar el Doflin.");
      }

      toast.success(payload.message || "Doflin eliminado.");
      await refreshCollection();
      setDeletingItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      toast.error("No se pudo cerrar sesión.");
    }
  };

  // ── CSV parser ───────────────────────────────────────────────────────────────
  const parseCsvFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { toast.error("El CSV está vacío o no tiene filas de datos."); return; }
      const VALID_RARITIES = new Set(["COMMON", "RARE", "EPIC", "LEGENDARY", "ULTRA", "MYTHIC"]);
      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [nombre, serie, rareza, probabilidad, numeroColeccion, modeloBase, variantName] = cols;
        if (!nombre || !serie || !rareza) continue;
        const safeSerie = (serie === "Animals" || serie === "Multiverse") ? serie : "Animals";
        const safeRareza = VALID_RARITIES.has(rareza.toUpperCase()) ? (rareza.toUpperCase() as Rarity) : "COMMON";
        rows.push({ nombre, serie: safeSerie, rareza: safeRareza, probabilidad: probabilidad || "15", numeroColeccion: numeroColeccion || "", modeloBase: modeloBase || nombre, variantName: variantName || "Original" });
      }
      setCsvRows(rows);
      if (rows.length === 0) toast.error("No se encontraron filas válidas en el CSV.");
      else toast.success(`${rows.length} figura(s) listas para importar.`);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async (): Promise<void> => {
    if (csvRows.length === 0) return;
    setCsvImporting(true);
    setCsvProgress({ done: 0, total: csvRows.length, failed: 0 });
    let failed = 0;
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const formData = new FormData();
      formData.set("name", row.nombre);
      formData.set("series", row.serie);
      formData.set("rarity", row.rareza);
      formData.set("probability", row.probabilidad);
      formData.set("collectionNumber", row.numeroColeccion);
      formData.set("baseModel", row.modeloBase);
      formData.set("variantName", row.variantName);
      formData.set("active", "true");
      const headers: HeadersInit = {};
      if (adminToken.trim()) headers["x-admin-token"] = adminToken.trim();
      try {
        const res = await fetch("/api/admin/doflins", { method: "POST", headers, body: formData });
        if (!res.ok) failed++;
      } catch { failed++; }
      setCsvProgress({ done: i + 1, total: csvRows.length, failed });
    }
    setCsvImporting(false);
    toast.success(`Importación completa: ${csvRows.length - failed} OK, ${failed} errores.`);
    setCsvRows([]);
    setCsvFile(null);
    setCsvProgress(null);
    void refreshCollection();
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-2">
        <h1 className="font-title text-4xl text-[var(--ink-900)]">Administrador de Doflins</h1>
        <p className="max-w-3xl text-sm text-[var(--ink-700)]">
          Alta rápida y automática. Solo completa los datos, sube la imagen y se guarda en el catálogo.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge className="bg-[#dbe4ff] text-[#1f2c67]">
            <ShieldCheckIcon className="h-4 w-4" /> Modo Admin
          </Badge>
          <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">
            {requireToken ? "Token opcional habilitado" : "Auth por Google"}
          </Badge>
          <Link href="/reveal">
            <Button variant="secondary" size="sm">
              <UserCircleIcon className="h-4 w-4" /> Ir a usuario
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
            Cerrar sesión
          </Button>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="border border-black/10 bg-white/85">
            <CardContent className="p-5 sm:p-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                {requireToken ? (
                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Token admin (opcional)</span>
                    <Input
                      value={adminToken}
                      onChange={(event) => setAdminToken(event.target.value)}
                      placeholder="ADMIN_FORM_TOKEN"
                    />
                    <p className="text-xs text-[var(--ink-600)]">
                      Alternativa para scripts o pruebas manuales. Con login Google no hace falta capturarlo.
                    </p>
                  </label>
                ) : null}

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Nombre *</span>
                    <Input
                      required
                      value={formValues.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setFormValues((previous) => ({
                          ...previous,
                          name,
                          baseModel:
                            previous.variantMode === "original" && previous.baseModel.trim().length === 0
                              ? name
                              : previous.baseModel,
                        }));
                      }}
                      placeholder="Doflin Jaguar Prisma"
                    />
                    {slugPreview ? (
                      <p className="text-xs text-[var(--ink-600)]">Slug automático: {slugPreview}</p>
                    ) : null}
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">¿Qué quieres crear? *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={formValues.variantMode}
                      onChange={(event) => handleVariantModeChange(event.target.value as VariantMode)}
                    >
                      <option value="original">Animal original</option>
                      <option value="variant">Variante</option>
                    </select>
                    <p className="text-xs text-[var(--ink-600)]">
                      Original crea el personaje base. Variante se vincula a un personaje ya creado.
                    </p>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">
                      {formValues.variantMode === "original" ? "Personaje base *" : "Animal base *"}
                    </span>
                    {formValues.variantMode === "original" ? (
                      <Input
                        required
                        value={formValues.baseModel}
                        onChange={(event) => onFieldChange("baseModel", event.target.value)}
                        placeholder="Tigre"
                      />
                    ) : (
                      <select
                        required
                        className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                        value={formValues.baseModel}
                        onChange={(event) => onFieldChange("baseModel", event.target.value)}
                        disabled={availableBaseModels.length === 0}
                      >
                        {availableBaseModels.length === 0 ? (
                          <option value="">No hay animales base en esta serie</option>
                        ) : null}
                        {availableBaseModels.map((baseModel) => (
                          <option key={baseModel} value={baseModel}>
                            {baseModel}
                          </option>
                        ))}
                      </select>
                    )}
                    {formValues.variantMode === "variant" && availableBaseModels.length === 0 ? (
                      <p className="text-xs text-[var(--ink-600)]">
                        Primero crea un original en {formValues.series} para luego agregar variantes.
                      </p>
                    ) : null}
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Variante *</span>
                    {formValues.variantMode === "original" ? (
                      <Input value="Original" disabled />
                    ) : (
                      <Input
                        required
                        value={formValues.variantName}
                        onChange={(event) => onFieldChange("variantName", event.target.value)}
                        placeholder="Naranja / Blanco / Prisma"
                      />
                    )}
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Serie *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={formValues.series}
                      onChange={(event) => handleSeriesChange(event.target.value as FormValues["series"])}
                    >
                      <option value="Animals">Animals</option>
                      <option value="Multiverse">Multiverse</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Número colección *</span>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={formValues.collectionNumber}
                      onChange={(event) => onFieldChange("collectionNumber", event.target.value)}
                      placeholder={String(nextCollectionBySeries[formValues.series])}
                    />
                    <p className="text-xs text-[var(--ink-600)]">
                      Sugerido para {formValues.series}: #{nextCollectionBySeries[formValues.series]}
                    </p>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Rareza *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={formValues.rarity}
                      onChange={(event) => {
                        const rarity = event.target.value as Rarity;
                        setFormValues((previous) => ({
                          ...previous,
                          rarity,
                          probability: String(RARITY_CONFIG[rarity].probability),
                        }));
                      }}
                    >
                      {RARITY_ORDER.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarityLabel(rarity)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Probabilidad (%) *</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={formValues.probability}
                      onChange={(event) => onFieldChange("probability", event.target.value)}
                      placeholder={String(RARITY_CONFIG[formValues.rarity].probability)}
                    />
                    <p className="text-xs text-[var(--ink-600)]">Se autocompleta según rareza (puedes ajustarla).</p>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Subir imagen *</span>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      required
                      onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    />
                    {imageFile ? <ImagePreview file={imageFile} /> : null}
                  </label>

                  {formValues.variantMode === "original" ? (
                    showVariantUpload ? (
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--ink-800)]">Subir variantes (opcional)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVariantFiles([]);
                              setShowVariantUpload(false);
                            }}
                          >
                            Ocultar
                          </Button>
                        </div>
                        <Input
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(event) => setVariantFiles(Array.from(event.target.files ?? []))}
                        />
                        <p className="text-xs text-[var(--ink-600)]">
                          {variantFiles.length} archivo(s) seleccionados. Se crean como variantes del mismo personaje base, en números consecutivos.
                        </p>
                        {variantNumberRangePreview ? (
                          <p className="text-xs text-[var(--ink-600)]">
                            Se intentará crear desde #{variantNumberRangePreview.from} hasta #{variantNumberRangePreview.to}.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-black/10 bg-[var(--surface-100)]/70 p-3 text-xs text-[var(--ink-700)] sm:col-span-2">
                        <p className="mb-2">
                          Si este personaje tendrá varias variantes, puedes subirlas en lote al mismo tiempo.
                        </p>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowVariantUpload(true)}>
                          Agregar variantes (opcional)
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="rounded-2xl border border-black/10 bg-[var(--surface-100)]/70 p-3 text-xs text-[var(--ink-700)] sm:col-span-2">
                      En modo <strong>Variante</strong> solo se crea una pieza por envío, enlazada al animal base seleccionado.
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-black/20"
                    checked={formValues.active}
                    onChange={(event) => onFieldChange("active", event.target.checked)}
                  />
                  Activo en catálogo
                </label>

                {isVariantBlocked ? (
                  <p className="text-sm font-medium text-[#935454]">
                    Primero crea un original en {formValues.series} para poder guardar variantes.
                  </p>
                ) : null}

                {/* ── Vista previa en catálogo ── */}
                {formValues.name.trim() ? (
                  <CatalogCardPreview
                    name={formValues.name}
                    rarity={formValues.rarity}
                    collectionNumber={formValues.collectionNumber}
                    series={formValues.series}
                    imageFile={imageFile}
                  />
                ) : null}

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isVariantBlocked}>
                  {isSubmitting
                    ? formValues.variantMode === "original"
                      ? "Guardando original..."
                      : "Guardando variante..."
                    : formValues.variantMode === "original"
                      ? "Crear original"
                      : "Crear variante"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-black/10 bg-white/85">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="space-y-1">
                <h2 className="font-title text-2xl text-[var(--ink-900)]">Carga masiva</h2>
                <p className="text-sm text-[var(--ink-700)]">
                  Sube varias imágenes y se crearán en lote. El nombre sale del nombre del archivo.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleBulkSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Serie *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={bulkValues.series}
                      onChange={(event) => {
                        const series = event.target.value as BulkValues["series"];
                        setBulkValues((previous) => ({
                          ...previous,
                          series,
                          startCollectionNumber: String(nextCollectionBySeries[series]),
                        }));
                      }}
                    >
                      <option value="Animals">Animals</option>
                      <option value="Multiverse">Multiverse</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Modelo base (opcional)</span>
                    <Input
                      value={bulkValues.baseModel}
                      onChange={(event) => onBulkFieldChange("baseModel", event.target.value)}
                      placeholder="Tigre"
                    />
                    <p className="text-xs text-[var(--ink-600)]">
                      Si lo pones, todos se guardan bajo ese personaje y la variante sale del nombre del archivo.
                    </p>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Número inicial *</span>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={bulkValues.startCollectionNumber}
                      onChange={(event) => onBulkFieldChange("startCollectionNumber", event.target.value)}
                      placeholder={String(nextCollectionBySeries[bulkValues.series])}
                    />
                    <p className="text-xs text-[var(--ink-600)]">
                      Se asigna consecutivo: #{bulkValues.startCollectionNumber}, #
                      {String(Number.parseInt(bulkValues.startCollectionNumber || "0", 10) + Math.max(bulkFiles.length - 1, 0))}
                    </p>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Rareza *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={bulkValues.rarity}
                      onChange={(event) => {
                        const rarity = event.target.value as Rarity;
                        setBulkValues((previous) => ({
                          ...previous,
                          rarity,
                          probability: String(RARITY_CONFIG[rarity].probability),
                        }));
                      }}
                    >
                      {RARITY_ORDER.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarityLabel(rarity)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Probabilidad (%) *</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={bulkValues.probability}
                      onChange={(event) => onBulkFieldChange("probability", event.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Imágenes (múltiples) *</span>
                  <Input
                    type="file"
                    multiple
                    required
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => setBulkFiles(Array.from(event.target.files ?? []))}
                  />
                  <p className="text-xs text-[var(--ink-600)]">{bulkFiles.length} archivo(s) seleccionados.</p>
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-black/20"
                    checked={bulkValues.active}
                    onChange={(event) => onBulkFieldChange("active", event.target.checked)}
                  />
                  Activo en catálogo
                </label>

                {bulkStatus ? (
                  <div className="rounded-2xl border border-black/10 bg-[var(--surface-200)]/60 p-3 text-xs text-[var(--ink-700)]">
                    Progreso: {bulkStatus.processed}/{bulkStatus.total} · OK: {bulkStatus.success} · Error: {bulkStatus.failed}
                  </div>
                ) : null}

                <Button type="submit" className="w-full sm:w-auto" disabled={isBulkSubmitting}>
                  {isBulkSubmitting ? "Subiendo lote..." : "Crear lote de Doflins"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Importar desde CSV ──────────────────────────────────────────── */}
          <Card className="border border-black/10 bg-white/85">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-title text-2xl text-[var(--ink-900)]">Importar desde CSV</h2>
                <p className="mt-1 text-xs text-[var(--ink-600)]">
                  Columnas: <code className="rounded bg-black/5 px-1">nombre,serie,rareza,probabilidad,numeroColeccion,modeloBase,variantName</code>
                </p>
              </div>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-[var(--ink-800)]">Archivo CSV</span>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setCsvFile(file);
                    setCsvRows([]);
                    if (file) parseCsvFile(file);
                  }}
                />
              </label>
              {csvRows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-black/10">
                  <table className="w-full min-w-[480px] text-xs">
                    <thead className="bg-[#f4f6e8] text-[var(--ink-700)]">
                      <tr>
                        {["Nombre", "Serie", "Rareza", "Nº", "Modelo base", "Variante"].map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="border-t border-black/5 even:bg-[#fafaf6]">
                          <td className="max-w-[120px] truncate px-2 py-1.5">{row.nombre}</td>
                          <td className="px-2 py-1.5">{row.serie}</td>
                          <td className="px-2 py-1.5">{row.rareza}</td>
                          <td className="px-2 py-1.5">{row.numeroColeccion || "—"}</td>
                          <td className="max-w-[100px] truncate px-2 py-1.5">{row.modeloBase}</td>
                          <td className="px-2 py-1.5">{row.variantName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 8 && (
                    <p className="px-3 py-1.5 text-[11px] text-[var(--ink-500)] border-t border-black/5">
                      +{csvRows.length - 8} filas más…
                    </p>
                  )}
                </div>
              )}
              {csvProgress && (
                <div className="rounded-2xl border border-black/10 bg-[var(--surface-200)]/60 p-3 text-xs text-[var(--ink-700)]">
                  Importando {csvProgress.done}/{csvProgress.total} · Errores: {csvProgress.failed}
                </div>
              )}
              <Button
                onClick={() => void handleCsvImport()}
                disabled={csvRows.length === 0 || csvImporting}
                className="w-full sm:w-auto"
              >
                {csvImporting ? `Importando ${csvProgress?.done ?? 0}/${csvProgress?.total ?? 0}...` : `Importar ${csvRows.length} figura(s)`}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border border-black/10 bg-white/85">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-title text-2xl text-[var(--ink-900)]">Resumen</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#edf4d8] text-[var(--ink-900)]">Animals: {seriesCount.animals}</Badge>
                <Badge className="bg-[#e9efff] text-[var(--ink-900)]">Multiverse: {seriesCount.multiverse}</Badge>
                <Badge className="bg-white text-[var(--ink-900)]">Total: {adminItems.length}</Badge>
              </div>
              <Button variant="secondary" onClick={() => void refreshCollection()}>
                Recargar colección
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-black/10 bg-white/85">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-title text-2xl text-[var(--ink-900)]">CRUD de catálogo</h2>

              <Input
                value={crudQuery}
                onChange={(event) => setCrudQuery(event.target.value)}
                placeholder="Buscar por nombre, modelo base, variante o número"
              />

              {isLoadingCollection ? <p className="text-sm text-[var(--ink-700)]">Cargando catálogo...</p> : null}

              {!isLoadingCollection && crudItems.length === 0 ? (
                <p className="text-sm text-[var(--ink-700)]">No hay Doflins cargados.</p>
              ) : null}

              <div className="max-h-[70vh] space-y-3 overflow-auto pr-1 sm:max-h-[560px]">
                {crudItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-black/10 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-200)]">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={120}
                          height={120}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ink-900)]">{item.name}</p>
                        <p className="text-xs text-[var(--ink-600)]">
                          {item.series} · #{String(item.collectionNumber).padStart(2, "0")} · {item.baseModel} /{" "}
                          {item.variantName}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <Badge className="bg-white text-[var(--ink-900)]">{rarityLabel(item.rarity)}</Badge>
                        <Badge className={item.active ? "bg-[#e6f7e9] text-[#21743e]" : "bg-[#f3f4f6] text-[#6b7280]"}>
                          {item.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2 sm:hidden">
                      <Badge className="bg-white text-[var(--ink-900)]">{rarityLabel(item.rarity)}</Badge>
                      <Badge className={item.active ? "bg-[#e6f7e9] text-[#21743e]" : "bg-[#f3f4f6] text-[#6b7280]"}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="h-11 w-full touch-manipulation px-3"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        <span>Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingToggleItem(item)}
                        disabled={toggleLoadingId === item.id}
                        className="h-11 w-full touch-manipulation px-3"
                      >
                        <span className="text-sm">
                          {toggleLoadingId === item.id ? "..." : item.active ? "Desactivar" : "Activar"}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingItem(item)}
                        disabled={deleteLoadingId === item.id}
                        aria-label={`Eliminar ${item.name}`}
                        className="h-11 w-full touch-manipulation px-3 text-[#b42318] hover:bg-[#fdecec] hover:text-[#8f1616]"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="text-sm">{deleteLoadingId === item.id ? "Eliminando..." : "Eliminar"}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(pendingToggleItem)}
        onOpenChange={(open) => {
          if (!open && toggleLoadingId === null) {
            setPendingToggleItem(null);
          }
        }}
      >
        <DialogContent className="w-[min(94vw,520px)]">
          <DialogHeader>
            <DialogTitle>{pendingToggleItem?.active ? "Desactivar Doflin" : "Activar Doflin"}</DialogTitle>
            <DialogDescription>
              {pendingToggleItem
                ? `Vas a ${pendingToggleItem.active ? "desactivar" : "activar"} ${pendingToggleItem.name} (${pendingToggleItem.baseModel} / ${pendingToggleItem.variantName}).`
                : "Confirma el cambio de estado."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="h-11 touch-manipulation"
              disabled={toggleLoadingId !== null}
              onClick={() => setPendingToggleItem(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-11 touch-manipulation"
              disabled={toggleLoadingId !== null || !pendingToggleItem}
              onClick={() => {
                if (!pendingToggleItem) {
                  return;
                }
                void handleToggleActive(pendingToggleItem);
              }}
            >
              {toggleLoadingId !== null ? "Guardando..." : pendingToggleItem?.active ? "Sí, desactivar" : "Sí, activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open && deleteLoadingId === null) {
            setDeletingItem(null);
          }
        }}
      >
        <DialogContent className="w-[min(94vw,520px)]">
          <DialogHeader>
            <DialogTitle>Eliminar Doflin</DialogTitle>
            <DialogDescription>
              {deletingItem
                ? `Vas a eliminar ${deletingItem.name} (${deletingItem.baseModel} / ${deletingItem.variantName}). Esta acción es permanente.`
                : "Esta acción es permanente."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="h-11 touch-manipulation"
              disabled={deleteLoadingId !== null}
              onClick={() => setDeletingItem(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleteLoadingId !== null}
              className="h-11 touch-manipulation bg-[#b42318] hover:bg-[#8f1616]"
              onClick={() => void handleDelete()}
            >
              {deleteLoadingId !== null ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingItem && editValues)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="w-[min(95vw,760px)]">
          <DialogHeader>
            <DialogTitle>Editar Doflin</DialogTitle>
            <DialogDescription>
              Actualiza datos, variante, rareza o imagen. Si solo cambias estado, usa activar/desactivar directo.
            </DialogDescription>
          </DialogHeader>

          {editingItem && editValues ? (
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Nombre *</span>
                  <Input
                    required
                    value={editValues.name}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              name: event.target.value,
                            }
                          : previous,
                      )
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Modelo base *</span>
                  <Input
                    required
                    value={editValues.baseModel}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              baseModel: event.target.value,
                            }
                          : previous,
                      )
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Variante *</span>
                  <Input
                    required
                    value={editValues.variantName}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              variantName: event.target.value,
                            }
                          : previous,
                      )
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Serie *</span>
                  <select
                    className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                    value={editValues.series}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              series: event.target.value as EditValues["series"],
                            }
                          : previous,
                      )
                    }
                  >
                    <option value="Animals">Animals</option>
                    <option value="Multiverse">Multiverse</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Número colección *</span>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={editValues.collectionNumber}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              collectionNumber: event.target.value,
                            }
                          : previous,
                      )
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Rareza *</span>
                  <select
                    className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                    value={editValues.rarity}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              rarity: event.target.value as Rarity,
                            }
                          : previous,
                      )
                    }
                  >
                    {RARITY_ORDER.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarityLabel(rarity)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Probabilidad (%) *</span>
                  <Input
                    required
                    type="number"
                    min={0}
                    max={100}
                    value={editValues.probability}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous
                          ? {
                              ...previous,
                              probability: event.target.value,
                            }
                          : previous,
                      )
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Reemplazar imagen</span>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => setEditImageFile(event.target.files?.[0] ?? null)}
                  />
                  {editImageFile ? <ImagePreview file={editImageFile} /> : null}
                </label>

                <label className="col-span-2 space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Dato curioso 🦔 <span className="font-normal text-[var(--ink-600)]">(opcional)</span></span>
                  <textarea
                    rows={3}
                    maxLength={400}
                    placeholder="Ej: El erizo puede recorrer hasta 3 km por noche en busca de alimento."
                    className="w-full resize-none rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    value={editValues.funFact}
                    onChange={(event) =>
                      setEditValues((previous) =>
                        previous ? { ...previous, funFact: event.target.value } : previous,
                      )
                    }
                  />
                  <p className="text-right text-[11px] text-[var(--ink-500)]">{editValues.funFact.length}/400</p>
                </label>

              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20"
                  checked={editValues.active}
                  onChange={(event) =>
                    setEditValues((previous) =>
                      previous
                        ? {
                            ...previous,
                            active: event.target.checked,
                          }
                        : previous,
                    )
                  }
                />
                Activo en catálogo
              </label>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeEditDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Toaster />
    </main>
  );
}
