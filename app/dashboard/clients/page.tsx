"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDashboardData, LoadingState, ErrorState } from "../shared";
import { ClientList } from "./client-list";
import { ClientDetail } from "./client-detail";

export default function ClientsDashboardPage() {
  const { data, error, isLoading, handleDeleteRecord } = useDashboardData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientFromUrl = searchParams.get("client");
  const [selectedClient, setSelectedClient] = useState<string | null>(
    clientFromUrl
  );

  function handleSelectClient(clientName: string) {
    setSelectedClient(clientName);
    router.replace(`/dashboard/clients?client=${encodeURIComponent(clientName)}`);
  }

  function handleBack() {
    setSelectedClient(null);
    router.replace("/dashboard/clients");
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  if (selectedClient) {
    return (
      <ClientDetail
        clientName={selectedClient}
        records={data.recentResponses}
        alerts={data.alerts}
        onBack={handleBack}
        onDelete={handleDeleteRecord}
      />
    );
  }

  return (
    <ClientList
      records={data.recentResponses}
      onSelectClient={handleSelectClient}
    />
  );
}
