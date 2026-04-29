import ProductForm from "../ProductForm";
import { getSuppliers } from "@/app/actions/product";

export default async function NewProductPage() {
  const suppliers = await getSuppliers();
  
  return <ProductForm suppliers={suppliers} />;
}
