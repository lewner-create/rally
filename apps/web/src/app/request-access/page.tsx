import { Suspense } from "react";
import RequestAccessClient from "./RequestAccessClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RequestAccessClient />
    </Suspense>
  );
}
