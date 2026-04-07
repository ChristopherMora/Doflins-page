"use client";

import Image from "next/image";
import Link from "next/link";
import { PencilSquareIcon, ShieldCheckIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";

import { RARITY_CONFIG, rarityLabel, RARITY_ORDER } from "@/lib/constants/rarity";
import type { Rarity } from "@/lib/types/doflin";
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

import type { DoflinAdminFormProps } from "./admin-form-types";
import { CatalogCardPreview, ImagePreview } from "./admin-form-utils";
import { useAdminForm } from "./use-admin-form";

export function DoflinAdminForm({ requireToken = false }: DoflinAdminFormProps): React.JSX.Element {
  const admin = useAdminForm({ requireToken });

  const {
    adminToken, setAdminToken,
    formValues, setFormValues, imageFile, setImageFile,
    variantFiles, setVariantFiles, showVariantUpload, setShowVariantUpload,
    isSubmitting, handleSubmit,
    slugPreview, availableBaseModels, variantNumberRangePreview, isVariantBlocked,
    nextCollectionBySeries,
    onFieldChange, handleVariantModeChange, handleSeriesChange,
    bulkValues, setBulkValues, bulkFiles, setBulkFiles,
    isBulkSubmitting, bulkStatus, handleBulkSubmit, onBulkFieldChange,
    adminItems, crudItems, crudQuery, setCrudQuery,
    isLoadingCollection, isUpdating,
    editingItem, editValues, setEditValues, editImageFile, setEditImageFile,
    deletingItem, setDeletingItem,
    pendingToggleItem, setPendingToggleItem,
    toggleLoadingId, deleteLoadingId,
    openEditDialog, closeEditDialog, handleEditSubmit,
    handleToggleActive, handleDelete,
    refreshCollection, handleSignOut,
    csvRows, setCsvFile, csvImporting, csvProgress,
    parseCsvFile, handleCsvImport,
    seriesCount,
  } = admin;

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
          {/* ── Single item creation form ── */}
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
                      onChange={(event) => handleVariantModeChange(event.target.value as "original" | "variant")}
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
                      onChange={(event) => handleSeriesChange(event.target.value as "Animals" | "Multiverse" | "MegaAnimals")}
                    >
                      <option value="Animals">Animals</option>
                      <option value="Multiverse">Multiverse</option>
                      <option value="MegaAnimals">Mega Animals 🦣</option>
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

          {/* ── Bulk upload form ── */}
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
                        const series = event.target.value as "Animals" | "Multiverse" | "MegaAnimals";
                        setBulkValues((previous) => ({
                          ...previous,
                          series,
                          startCollectionNumber: String(nextCollectionBySeries[series]),
                        }));
                      }}
                    >
                      <option value="Animals">Animals</option>
                      <option value="Multiverse">Multiverse</option>
                      <option value="MegaAnimals">Mega Animals 🦣</option>
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

          {/* ── CSV import ── */}
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

        {/* ── Right column: summary + CRUD ── */}
        <div className="space-y-4">
          <Card className="border border-black/10 bg-white/85">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-title text-2xl text-[var(--ink-900)]">Resumen</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#edf4d8] text-[var(--ink-900)]">Animals: {seriesCount.animals}</Badge>
                <Badge className="bg-[#fff4d8] text-[var(--ink-900)]">Mega Animals: {seriesCount.megaAnimals}</Badge>
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

      {/* ── Toggle dialog ── */}
      <Dialog
        open={Boolean(pendingToggleItem)}
        onOpenChange={(open) => {
          if (!open && toggleLoadingId === null) setPendingToggleItem(null);
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
            <Button type="button" variant="secondary" className="h-11 touch-manipulation" disabled={toggleLoadingId !== null} onClick={() => setPendingToggleItem(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-11 touch-manipulation"
              disabled={toggleLoadingId !== null || !pendingToggleItem}
              onClick={() => { if (pendingToggleItem) void handleToggleActive(pendingToggleItem); }}
            >
              {toggleLoadingId !== null ? "Guardando..." : pendingToggleItem?.active ? "Sí, desactivar" : "Sí, activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open && deleteLoadingId === null) setDeletingItem(null);
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
            <Button type="button" variant="secondary" className="h-11 touch-manipulation" disabled={deleteLoadingId !== null} onClick={() => setDeletingItem(null)}>
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

      {/* ── Edit dialog ── */}
      <Dialog
        open={Boolean(editingItem && editValues)}
        onOpenChange={(open) => { if (!open) closeEditDialog(); }}
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
                  <Input required value={editValues.name} onChange={(event) => setEditValues((prev) => prev ? { ...prev, name: event.target.value } : prev)} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Modelo base *</span>
                  <Input required value={editValues.baseModel} onChange={(event) => setEditValues((prev) => prev ? { ...prev, baseModel: event.target.value } : prev)} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Variante *</span>
                  <Input required value={editValues.variantName} onChange={(event) => setEditValues((prev) => prev ? { ...prev, variantName: event.target.value } : prev)} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Serie *</span>
                  <select
                    className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                    value={editValues.series}
                    onChange={(event) => setEditValues((prev) => prev ? { ...prev, series: event.target.value as "Animals" | "Multiverse" | "MegaAnimals" } : prev)}
                  >
                    <option value="Animals">Animals</option>
                    <option value="Multiverse">Multiverse</option>
                    <option value="MegaAnimals">Mega Animals 🦣</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Número colección *</span>
                  <Input required type="number" min={1} value={editValues.collectionNumber} onChange={(event) => setEditValues((prev) => prev ? { ...prev, collectionNumber: event.target.value } : prev)} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Rareza *</span>
                  <select
                    className="h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-[var(--ink-900)]"
                    value={editValues.rarity}
                    onChange={(event) => setEditValues((prev) => prev ? { ...prev, rarity: event.target.value as Rarity } : prev)}
                  >
                    {RARITY_ORDER.map((rarity) => (
                      <option key={rarity} value={rarity}>{rarityLabel(rarity)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Probabilidad (%) *</span>
                  <Input required type="number" min={0} max={100} value={editValues.probability} onChange={(event) => setEditValues((prev) => prev ? { ...prev, probability: event.target.value } : prev)} />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-[var(--ink-800)]">Reemplazar imagen</span>
                  <Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => setEditImageFile(event.target.files?.[0] ?? null)} />
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
                    onChange={(event) => setEditValues((prev) => prev ? { ...prev, funFact: event.target.value } : prev)}
                  />
                  <p className="text-right text-[11px] text-[var(--ink-500)]">{editValues.funFact.length}/400</p>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20"
                  checked={editValues.active}
                  onChange={(event) => setEditValues((prev) => prev ? { ...prev, active: event.target.checked } : prev)}
                />
                Activo en catálogo
              </label>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeEditDialog}>Cancelar</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Toaster />
    </main>
  );
}
