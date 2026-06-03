import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { groupsApi } from "../api/groupsApi";
import { GROUP_STATUS } from "../data/groups";
import { useAuth } from "./AuthContext";

const GroupsContext = createContext(null);

export function GroupsProvider({ children }) {
  const { isAdmin } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isAdmin) {
        // Load all groups (pending, approved, rejected) for admin
        const { adminApi } = await import("../api/adminApi");
        data = await adminApi.listGroups();
      } else {
        // Load only approved groups for public catalog
        data = await groupsApi.listApproved();
      }
      const groupsData = Array.isArray(data) ? data : [];
      setGroups(groupsData);
      console.log("[DEBUG] Grupos carregados:", {
        count: groupsData.length,
        statuses: groupsData.map((g) => ({ id: g.id, status: g.status || "undefined" })),
      });
    } catch (err) {
      setGroups([]);
      setError(err?.message ?? "Não foi possível carregar os grupos.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGroup = useCallback(
    async (payload) => {
      const data = await groupsApi.create(payload);
      await refresh();
      return data;
    },
    [refresh],
  );

  const approveGroup = useCallback(
    async (id) => {
      const { adminApi } = await import("../api/adminApi");
      await adminApi.approve(id);
      await refresh();
    },
    [refresh],
  );

  const rejectGroup = useCallback(
    async (id, reason) => {
      const { adminApi } = await import("../api/adminApi");
      await adminApi.reject(id, reason);
      await refresh();
    },
    [refresh],
  );

  const deleteGroup = useCallback(
    async (id) => {
      const { adminApi } = await import("../api/adminApi");
      await adminApi.delete(id);
      await refresh();
    },
    [refresh],
  );

  const approvedGroups = useMemo(
    () => {
      // Para admin: filtrar por APPROVED. Para público: mostrar tudo (backend retorna apenas aprovados)
      if (isAdmin) {
        return groups.filter((g) => g.status === GROUP_STATUS.APPROVED);
      }
      return groups;
    },
    [groups, isAdmin],
  );

  const pendingGroups = useMemo(
    () => groups.filter((g) => g.status === GROUP_STATUS.PENDING),
    [groups],
  );

  const value = useMemo(
    () => ({
      groups,
      approvedGroups,
      pendingGroups,
      loading,
      error,
      refresh,
      createGroup,
      approveGroup,
      rejectGroup,
      deleteGroup,
    }),
    [
      groups,
      approvedGroups,
      pendingGroups,
      loading,
      error,
      refresh,
      createGroup,
      approveGroup,
      rejectGroup,
      deleteGroup,
    ],
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups deve ser usado dentro de GroupsProvider");
  return ctx;
}
