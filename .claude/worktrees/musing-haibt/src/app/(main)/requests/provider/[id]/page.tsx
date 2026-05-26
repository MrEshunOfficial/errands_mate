import { Card } from "@/components/ui/card";

export default function page() {
  return (
    <div className="w-full h-screen flex items-center justify-center p-2">
      <Card className="w-1/2 h-1/2 border border-dashed border-gray-300 dark:border-gray-600/50 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Provider Request Page
      </Card>
    </div>
  );
}
