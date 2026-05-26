import HelpPage from "@/components/layouts/HelpPage";

export const metadata = { title: "Help & Support – Errand Mate" };

export default function Page() {
  return (
    <div className="w-full h-full overflow-auto pb-4 hide-scrollbar">
      <HelpPage />
    </div>
  );
}
