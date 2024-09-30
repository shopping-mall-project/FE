'use client';

import { Image } from "@nextui-org/react";
import { Pagination } from "@nextui-org/react";
import useAllProducts from "@/hooks/useAllProducts";
import { useRouter } from "next/navigation";

const Products = () => {
  const router = useRouter();
  const { data, isLoading } = useAllProducts(1);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  const handleRouteProductDetail = (productID: string) => router.push(`products/product-detail/${productID}`);

  return (
    <div className="max-w-[1400px] mx-auto">
      <h2 className="font-semibold pl-1">
        상품 목록
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
        {data?.data?.results.map((product: any) => (
          <div
            key={product._id}
            className="flex flex-col justify-between gap-2 text-sm text-gray-800 p-2 cursor-pointer"
            onClick={() => handleRouteProductDetail(product?._id)}
          >
            <Image
              src={product?.product.thumbnail}
              alt={product.title}
              width={300}
              height={250}
              className="rounded-md object-contain"
            />
            <h3 className="font-semibold">{product.title}</h3>
            <p className="font-semibold">{product?.product.price}원</p>
            <div className="flex justify-between text-xs">
              <p>{formatDate(product.createdAt)}</p>
              <p>{product?.product.stock_quantity}개의 재고</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-10">
        <Pagination showControls total={10} initialPage={1} />
      </div>
    </div>
  );
};

export default Products;