import { NextRequest, NextResponse } from "next/server";

import { rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { fetchShopProductByHandle } from "@/lib/server/shopify-storefront";
import { productHandleParamsSchema } from "@/lib/validation/shopify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProductByHandleContext {
  params: Promise<{
    handle: string;
  }>;
}

export async function GET(request: NextRequest, context: ProductByHandleContext): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "shop_product_handle", 80, 60_000);
  if (limited) {
    return limited;
  }

  const params = await context.params;
  const parsed = productHandleParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_handle",
        message: "Handle inválido.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const product = await fetchShopProductByHandle(parsed.data.handle);
    if (!product) {
      return NextResponse.json(
        {
          status: "error",
          code: "not_found",
          message: "Producto no encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      status: "ok",
      source: "shopify",
      product,
    });
  } catch (error) {
    console.error("shop/product/:handle error", error);
    return toApiErrorResponse(error);
  }
}
