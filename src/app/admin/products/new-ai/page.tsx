import BulkProductEditor from "../BulkProductEditor";
import { getSuppliers } from "@/app/actions/product";

export default async function NewAiProductPage() {
  const suppliers = await getSuppliers();
  return <BulkProductEditor suppliers={suppliers} />;
}
