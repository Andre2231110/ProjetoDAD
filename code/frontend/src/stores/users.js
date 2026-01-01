import { defineStore } from "pinia";
import axios from "axios";

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
    meta: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    },
    loading: false,
    error: "",
}),
  actions: {
    async fetchUsers(page = 1, perPage = 10) {
      this.loading = true;
      this.error = "";
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/admin/users?per_page=${perPage}&page=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.users = res.data.data;
        this.meta = res.data.meta;
      } catch (err) {
        this.error = err.response?.data?.error || "Erro ao buscar usuários";
      } finally {
        this.loading = false;
      }
    },
  },
});
