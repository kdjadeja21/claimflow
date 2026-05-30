import { PublicEventProvider } from "@/components/providers/PublicEventProvider";

export default function PublicEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return <PublicEventProvider params={params}>{children}</PublicEventProvider>;
}
