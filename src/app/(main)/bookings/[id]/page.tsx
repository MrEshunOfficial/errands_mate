import BookingDetailPage from "@/components/operations/bookings/BookingDetailPage";

export const metadata = { title: "Booking Details" };

export default function Page() {
  return (
    <div className="h-full overflow-y-auto">
      <BookingDetailPage />
    </div>
  );
}
