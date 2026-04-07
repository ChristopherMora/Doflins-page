"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Rarity } from "@/lib/types/doflin";

import {
  ADMIN_TOKEN_STORAGE_KEY,
  INITIAL_BULK_VALUES,
  INITIAL_VALUES,
  type AdminCollectionResponse,
  type AdminDoflinItem,
  type BulkValues,
  type CreateDoflinResponse,
  type CsvRow,
  type EditValues,
  type FormValues,
  type VariantMode,
} from "./admin-form-types";
import { fileNameToDoflinName, toSlugPreview } from "./admin-form-utils";

export interface UseAdminFormOptions {
  requireToken: boolean;
}

export function useAdminForm({ requireToken }: UseAdminFormOptions) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [adminToken, setAdminToken] = useState("");

  // ── Main form state ───────────────────────────────────────────────────────
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [bulkValues, setBulkValues] = useState<BulkValues>(INITIAL_BULK_VALUES);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variantFiles, setVariantFiles] = useState<File[]>([]);
  const [showVariantUpload, setShowVariantUpload] = useState(false);

  // ── Bulk state ────────────────────────────────────────────────────────────
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // ── CRUD state ────────────────────────────────────────────────────────────
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

  // ── CSV import state ──────────────────────────────────────────────────────
  const [, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  // ── Memos ─────────────────────────────────────────────────────────────────
  const seriesCount = useMemo(
    () => ({
      animals: adminItems.filter((item) => item.series.toLowerCase() === "animals").length,
      multiverse: adminItems.filter((item) => item.series.toLowerCase() === "multiverse").length,
      megaAnimals: adminItems.filter((item) => item.series.toLowerCase() === "megaanimals").length,
    }),
    [adminItems],
  );

  const nextCollectionBySeries = useMemo(() => {
    const maxBySeries = adminItems.reduce(
      (accumulator, item) => {
        const series =
          item.series === "Multiverse" ? "Multiverse" : item.series === "MegaAnimals" ? "MegaAnimals" : "Animals";
        accumulator[series] = Math.max(accumulator[series], item.collectionNumber);
        return accumulator;
      },
      { Animals: 0, Multiverse: 0, MegaAnimals: 0 },
    );

    return {
      Animals: maxBySeries.Animals + 1,
      Multiverse: maxBySeries.Multiverse + 1,
      MegaAnimals: maxBySeries.MegaAnimals + 1,
    };
  }, [adminItems]);

  const baseModelsBySeries = useMemo(() => {
    const bySeries: Record<FormValues["series"], string[]> = { Animals: [], Multiverse: [], MegaAnimals: [] };
    const seen: Record<FormValues["series"], Set<string>> = { Animals: new Set(), Multiverse: new Set(), MegaAnimals: new Set() };

    for (const item of adminItems) {
      const series =
        item.series === "Multiverse" ? "Multiverse" : item.series === "MegaAnimals" ? "MegaAnimals" : "Animals";
      const normalizedBase = item.baseModel.trim();
      if (!normalizedBase) continue;
      const slug = normalizedBase.toLowerCase();
      if (seen[series].has(slug)) continue;
      seen[series].add(slug);
      bySeries[series].push(normalizedBase);
    }

    bySeries.Animals.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    bySeries.Multiverse.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    bySeries.MegaAnimals.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    return bySeries;
  }, [adminItems]);

  const availableBaseModels = useMemo(
    () => baseModelsBySeries[formValues.series],
    [baseModelsBySeries, formValues.series],
  );

  const slugPreview = useMemo(() => toSlugPreview(formValues.name), [formValues.name]);

  const variantNumberRangePreview = useMemo(() => {
    if (formValues.variantMode !== "original" || variantFiles.length === 0) return null;
    const parsedBaseNumber = Number.parseInt(formValues.collectionNumber, 10);
    const safeBaseNumber =
      Number.isInteger(parsedBaseNumber) && parsedBaseNumber > 0
        ? parsedBaseNumber
        : nextCollectionBySeries[formValues.series];
    return { from: safeBaseNumber + 1, to: safeBaseNumber + variantFiles.length };
  }, [formValues.collectionNumber, formValues.series, formValues.variantMode, nextCollectionBySeries, variantFiles.length]);

  const isVariantBlocked = useMemo(
    () => formValues.variantMode === "variant" && (availableBaseModels.length === 0 || !formValues.baseModel.trim()),
    [availableBaseModels.length, formValues.baseModel, formValues.variantMode],
  );

  const crudItems = useMemo(() => {
    const normalizedQuery = crudQuery.trim().toLowerCase();
    return adminItems
      .filter((item) => {
        if (!normalizedQuery) return true;
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

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const getAuthHeaders = useCallback((): HeadersInit => {
    if (!adminToken.trim()) return {};
    return { "x-admin-token": adminToken.trim() };
  }, [adminToken]);

  const refreshCollection = useCallback(async (): Promise<void> => {
    setIsLoadingCollection(true);
    try {
      const headers: HeadersInit = {};
      if (adminToken.trim()) headers["x-admin-token"] = adminToken.trim();
      const response = await fetch("/api/admin/doflins", { cache: "no-store", headers });
      if (response.status === 401) { setAdminItems([]); return; }
      if (!response.ok) throw new Error("No se pudo cargar el catálogo actual.");
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

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { void refreshCollection(); }, [refreshCollection]);

  useEffect(() => {
    if (!requireToken || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim();
    if (saved) setAdminToken(saved);
  }, [requireToken]);

  useEffect(() => {
    if (!requireToken || typeof window === "undefined") return;
    const token = adminToken.trim();
    if (!token) { window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY); return; }
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  }, [adminToken, requireToken]);

  useEffect(() => {
    setFormValues((previous) => {
      if (previous.collectionNumber.trim().length > 0) return previous;
      return { ...previous, collectionNumber: String(nextCollectionBySeries[previous.series]) };
    });
  }, [nextCollectionBySeries]);

  useEffect(() => {
    setBulkValues((previous) => {
      if (previous.startCollectionNumber.trim().length > 0) return previous;
      return { ...previous, startCollectionNumber: String(nextCollectionBySeries[previous.series]) };
    });
  }, [nextCollectionBySeries]);

  useEffect(() => {
    setFormValues((previous) => {
      if (previous.variantMode !== "variant") return previous;
      const seriesModels = baseModelsBySeries[previous.series];
      if (seriesModels.length === 0) {
        if (!previous.baseModel) return previous;
        return { ...previous, baseModel: "" };
      }
      if (seriesModels.includes(previous.baseModel.trim())) return previous;
      return { ...previous, baseModel: seriesModels[0] };
    });
  }, [baseModelsBySeries]);

  // ── Field handlers ────────────────────────────────────────────────────────
  const onFieldChange = <T extends keyof FormValues>(field: T, value: FormValues[T]): void => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const handleVariantModeChange = (mode: VariantMode): void => {
    setFormValues((previous) => {
      if (previous.variantMode === mode) return previous;
      if (mode === "original") {
        return { ...previous, variantMode: "original", baseModel: previous.baseModel.trim() || previous.name.trim(), variantName: "Original" };
      }
      return { ...previous, variantMode: "variant", baseModel: baseModelsBySeries[previous.series][0] ?? "", variantName: "" };
    });
    setVariantFiles([]);
    setShowVariantUpload(false);
  };

  const handleSeriesChange = (series: FormValues["series"]): void => {
    setFormValues((previous) => {
      const nextValues: FormValues = { ...previous, series, collectionNumber: String(nextCollectionBySeries[series]) };
      if (previous.variantMode === "variant") {
        const seriesModels = baseModelsBySeries[series];
        nextValues.baseModel = seriesModels.includes(previous.baseModel.trim()) ? previous.baseModel : (seriesModels[0] ?? "");
      }
      return nextValues;
    });
  };

  const onBulkFieldChange = <T extends keyof BulkValues>(field: T, value: BulkValues[T]): void => {
    setBulkValues((previous) => ({ ...previous, [field]: value }));
  };

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!imageFile) { toast.error("Debes subir la imagen del Doflin."); return; }

    const baseCollectionNumber = Number.parseInt(formValues.collectionNumber, 10);
    if (!Number.isInteger(baseCollectionNumber) || baseCollectionNumber <= 0) {
      toast.error("El número de colección debe ser un entero positivo."); return;
    }

    const normalizedName = formValues.name.trim();
    const normalizedBaseModel =
      formValues.variantMode === "original" ? (formValues.baseModel.trim() || normalizedName) : formValues.baseModel.trim();
    const normalizedVariantName = formValues.variantMode === "original" ? "Original" : formValues.variantName.trim();

    if (!normalizedBaseModel) { toast.error("Selecciona un animal base para guardar la variante."); return; }
    if (formValues.variantMode === "variant" && !normalizedVariantName) { toast.error("Escribe el nombre de la variante."); return; }

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
    if (adminToken.trim()) formData.set("token", adminToken.trim());
    if (imageFile) formData.set("imageFile", imageFile);

    try {
      const response = await fetch("/api/admin/doflins", { method: "POST", body: formData, headers: getAuthHeaders() });
      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") throw new Error(payload.message || "No se pudo crear el Doflin.");

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
          if (adminToken.trim()) variantCreateData.set("token", adminToken.trim());

          try {
            const variantResponse = await fetch("/api/admin/doflins", { method: "POST", body: variantCreateData, headers: getAuthHeaders() });
            const variantPayload = (await variantResponse.json()) as CreateDoflinResponse;
            if (!variantResponse.ok || variantPayload.status !== "ok") {
              variantFailures.push(`${file.name}: ${variantPayload.message || "No se pudo crear la variante."}`);
              continue;
            }
            variantSuccess += 1;
          } catch (error) {
            variantFailures.push(`${file.name}: ${error instanceof Error ? error.message : "Error al crear variante."}`);
          }
        }
      }

      if (formValues.variantMode === "original" && variantFiles.length > 0) {
        if (variantSuccess === variantFiles.length) toast.success(`Doflin creado + ${variantSuccess} variante(s) guardadas.`);
        else if (variantSuccess > 0) toast.success(`Doflin creado + ${variantSuccess} variante(s). Algunas fallaron.`);
        else toast.success("Doflin base creado. No se pudieron crear variantes.");
        if (variantFailures.length > 0) toast.error(`Errores en variantes: ${variantFailures.slice(0, 2).join(" | ")}`);
      } else {
        toast.success(payload.message || "Doflin creado correctamente.");
      }

      setFormValues((previous) => ({ ...INITIAL_VALUES, series: previous.series, collectionNumber: "" }));
      setImageFile(null);
      setVariantFiles([]);
      setShowVariantUpload(false);
      await refreshCollection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el Doflin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (bulkFiles.length === 0) { toast.error("Selecciona al menos una imagen para carga masiva."); return; }
    const startNumber = Number.parseInt(bulkValues.startCollectionNumber, 10);
    if (!Number.isInteger(startNumber) || startNumber <= 0) { toast.error("El número inicial de colección debe ser un entero positivo."); return; }

    setIsBulkSubmitting(true);
    setBulkStatus({ total: bulkFiles.length, processed: 0, success: 0, failed: 0 });

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
      if (adminToken.trim()) formData.set("token", adminToken.trim());

      try {
        const response = await fetch("/api/admin/doflins", { method: "POST", body: formData, headers: getAuthHeaders() });
        const payload = (await response.json()) as CreateDoflinResponse;
        if (!response.ok || payload.status !== "ok") {
          failed += 1;
          failedMessages.push(`${file.name}: ${payload.message || "No se pudo crear el Doflin en carga masiva."}`);
        } else {
          success += 1;
        }
      } catch (error) {
        failed += 1;
        failedMessages.push(`${file.name}: ${error instanceof Error ? error.message : "Error de red"}`);
      } finally {
        setBulkStatus({ total: bulkFiles.length, processed: index + 1, success, failed });
      }
    }

    if (success > 0) toast.success(`Carga masiva completada. ${success} creados, ${failed} con error.`);
    else toast.error("No se pudo crear ningún Doflin en la carga masiva.");
    if (failedMessages.length > 0) toast.error(`Errores: ${failedMessages.slice(0, 2).join(" | ")}`);

    setIsBulkSubmitting(false);
    setBulkFiles([]);
    setBulkStatus(null);
    setBulkValues((previous) => ({ ...previous, startCollectionNumber: String(startNumber + success) }));
    await refreshCollection();
  };

  // ── CRUD operations ───────────────────────────────────────────────────────
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
    if (!editingItem || !editValues) return;

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
    if (adminToken.trim()) formData.set("token", adminToken.trim());
    if (editImageFile) formData.set("imageFile", editImageFile);

    try {
      const response = await fetch(`/api/admin/doflins?id=${editingItem.id}`, { method: "PUT", headers: getAuthHeaders(), body: formData });
      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") throw new Error(payload.message || "No se pudo actualizar el Doflin.");
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
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") throw new Error(payload.message || "No se pudo cambiar el estado.");
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
    if (!deletingItem) return;
    setDeleteLoadingId(deletingItem.id);
    try {
      const response = await fetch(`/api/admin/doflins?id=${deletingItem.id}`, { method: "DELETE", headers: getAuthHeaders() });
      const payload = (await response.json()) as CreateDoflinResponse;
      if (!response.ok || payload.status !== "ok") throw new Error(payload.message || "No se pudo eliminar el Doflin.");
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

  // ── CSV ───────────────────────────────────────────────────────────────────
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

  return {
    // Auth
    adminToken, setAdminToken, requireToken,
    // Main form
    formValues, setFormValues, imageFile, setImageFile,
    variantFiles, setVariantFiles, showVariantUpload, setShowVariantUpload,
    isSubmitting, handleSubmit,
    // Derived
    slugPreview, availableBaseModels, variantNumberRangePreview, isVariantBlocked,
    nextCollectionBySeries,
    // Field handlers
    onFieldChange, handleVariantModeChange, handleSeriesChange,
    // Bulk
    bulkValues, setBulkValues, bulkFiles, setBulkFiles,
    isBulkSubmitting, bulkStatus, handleBulkSubmit, onBulkFieldChange,
    // CRUD
    adminItems, crudItems, crudQuery, setCrudQuery,
    isLoadingCollection, isUpdating,
    editingItem, editValues, setEditValues, editImageFile, setEditImageFile,
    deletingItem, setDeletingItem,
    pendingToggleItem, setPendingToggleItem,
    toggleLoadingId, deleteLoadingId,
    openEditDialog, closeEditDialog, handleEditSubmit,
    handleToggleActive, handleDelete,
    refreshCollection, handleSignOut,
    // CSV
    csvRows, setCsvFile, csvImporting, csvProgress,
    parseCsvFile, handleCsvImport,
    // Stats
    seriesCount,
  };
}
