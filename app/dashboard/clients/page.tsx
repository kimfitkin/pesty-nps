"use client";

import { useState } from "react";
import { useDashboardData, LoadingState, ErrorState } from "../shared";
import { ClientList } from "./client-list";
import { ClientDetail } from "./client-detail";

export default function ClientsDashboardPage() {
  const { data, error, isLoading, handleDeleteRecord } = useDashboardData();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  if (selectedClient) {
    return (
      <ClientDetail
        clientName={selectedClient}
        records={data.recentResponses}
        alerts={data.alerts}
        onBack={() => setSelectedClient(null)}
        onDelete={handleDeleteRecord}
      />
    );
  }

  return (
    <ClientList
      records={data.recentResponses}
      onSelectClient={setSelectedClient}
    />
  );
}
