import { statusTone } from "@/lib/format";

export default function Badge({ status }: { status: string }) {
  return <span className={`badge ${statusTone(status)}`}>{status.replace("_", " ")}</span>;
}
