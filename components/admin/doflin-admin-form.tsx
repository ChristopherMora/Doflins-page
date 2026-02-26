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

interface FormValues {
  name: string;
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
}

interface DoflinAdminFormProps {
  requireToken?: boolean;
}

const INITIAL_VALUES: FormValues = {
  name: "",
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

export function DoflinAdminForm({ requireToken = false }: DoflinAdminFormProps): React.JSX.Element {
  const [adminToken, setAdminToken] = useState("");
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [bulkValues, setBulkValues] = useState<BulkValues>(INITIAL_BULK_VALUES);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [silhouetteFile, setSilhouetteFile] = useState<File | null>(null);
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
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editSilhouetteFile, setEditSilhouetteFile] = useState<File | null>(null);
  const [bulkStatus, setBulkStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
  } | null>(null);

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

  const slugPreview = useMemo(() => toSlugPreview(formValues.name), [formValues.name]);

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

  const onFieldChange = <T extends keyof FormValues>(field: T, value: FormValues[T]): void => {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
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

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", formValues.name.trim());
    formData.set("baseModel", formValues.baseModel.trim());
    formData.set("variantName", formValues.variantName.trim());
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

    if (silhouetteFile) {
      formData.set("silhouetteFile", silhouetteFile);
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

      toast.success(payload.message || "Doflin creado correctamente.");
      setFormValues((previous) => ({
        ...INITIAL_VALUES,
        series: previous.series,
        collectionNumber: "",
      }));
      setImageFile(null);
      setSilhouetteFile(null);
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
    });
    setEditImageFile(null);
    setEditSilhouetteFile(null);
  };

  const closeEditDialog = (): void => {
    setEditingItem(null);
    setEditValues(null);
    setEditImageFile(null);
    setEditSilhouetteFile(null);
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

    if (adminToken.trim()) {
      formData.set("token", adminToken.trim());
    }

    if (editImageFile) {
      formData.set("imageFile", editImageFile);
    }

    if (editSilhouetteFile) {
      formData.set("silhouetteFile", editSilhouetteFile);
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
      await refreshCollection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = async (item: AdminDoflinItem): Promise<void> => {
    const shouldDelete = window.confirm(
      `Eliminar ${item.name} (${item.baseModel} / ${item.variantName})? Esta acción es permanente.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeleteLoadingId(item.id);

    try {
      const response = await fetch(`/api/admin/doflins?id=${item.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.message || "No se pudo eliminar el Doflin.");
      }

      toast.success(payload.message || "Doflin eliminado.");
      await refreshCollection();
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
      window.location.href = "/admin/login";
    } catch {
      toast.error("No se pudo cerrar sesión.");
    }
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
              Acceso rápido
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
                          baseModel: previous.baseModel.trim().length > 0 ? previous.baseModel : name,
                        }));
                      }}
                      placeholder="Doflin Jaguar Prisma"
                    />
                    {slugPreview ? (
                      <p className="text-xs text-[var(--ink-600)]">Slug automático: {slugPreview}</p>
                    ) : null}
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Modelo base *</span>
                    <Input
                      required
                      value={formValues.baseModel}
                      onChange={(event) => onFieldChange("baseModel", event.target.value)}
                      placeholder="Tigre"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Variante *</span>
                    <Input
                      required
                      value={formValues.variantName}
                      onChange={(event) => onFieldChange("variantName", event.target.value)}
                      placeholder="Naranja / Blanco / Multicolor"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Serie *</span>
                    <select
                      className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                      value={formValues.series}
                      onChange={(event) => {
                        const series = event.target.value as FormValues["series"];
                        setFormValues((previous) => ({
                          ...previous,
                          series,
                          collectionNumber: String(nextCollectionBySeries[series]),
                        }));
                      }}
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
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-[var(--ink-800)]">Subir silueta</span>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => setSilhouetteFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
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

                <div className="rounded-2xl border border-black/10 bg-[var(--surface-200)]/60 p-3 text-xs text-[var(--ink-700)]">
                  La imagen se guarda en `public/uploads/doflins/`. Si no subes silueta, se usa placeholder automático.
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Crear Doflin"}
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

              <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
                {crudItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-2">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-[var(--surface-200)]">
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-white text-[var(--ink-900)]">{rarityLabel(item.rarity)}</Badge>
                      <Badge className={item.active ? "bg-[#e6f7e9] text-[#21743e]" : "bg-[#f3f4f6] text-[#6b7280]"}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="h-8 px-3"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleToggleActive(item)}
                          disabled={toggleLoadingId === item.id}
                          className="h-8 px-2"
                        >
                          {toggleLoadingId === item.id ? "..." : item.active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(item)}
                          disabled={deleteLoadingId === item.id}
                          className="h-8 px-2 text-[#b42318] hover:bg-[#fdecec] hover:text-[#8f1616]"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Reemplazar silueta</span>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => setEditSilhouetteFile(event.target.files?.[0] ?? null)}
                  />
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
