import React from "react";
import Image from "next/image";
import { TenantProduct } from "@/entities/event/tenant.entity";


interface ProductCardProps {
  product: TenantProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group bg-white shadow-sm hover:shadow-lg border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Product Image */}
      <div className="relative bg-gray-100 aspect-square overflow-hidden">
        {product.photo? (
          <Image
            src={product.photo}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2 p-4">
        <h4 className="font-bold text-gray-800 text-lg line-clamp-1 leading-tight">
          {product.name}
        </h4>
        <p className="text-gray-500 text-sm line-clamp-2">
          {product.description}
        </p>
        <p className="font-bold text-secondary text-lg">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
