<template>
  <div class="container mx-auto p-6 flex min-h-[80vh] items-center justify-center">

    <div class="w-full max-w-4xl space-y-8 shadow-2xl p-12 rounded-3xl bg-white border border-slate-100">

      <div class="space-y-2">
        <h2 class="text-center text-4xl font-black tracking-tight text-indigo-900 uppercase">
          Entrar na Conta
        </h2>
        <p class="text-center text-sm font-medium text-slate-400">
          Insere as tuas credenciais para acederes à tua área de jogo
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div class="space-y-1">
            <label for="email" class="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">
              Endereço de Email
            </label>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="exemplo@email.com"
            />
          </div>

          <div class="space-y-1">
            <label for="password" class="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">
              Palavra-passe
            </label>
            <Input
              id="password"
              v-model="formData.password"
              type="password"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="pt-4">
          <Button type="submit" class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-100 rounded-xl transition-all active:scale-95 cursor-pointer">
            Login
          </Button>
        </div>

        <div class="text-center text-sm font-bold">
          <span class="text-slate-400">Ainda não tens conta? </span>
          <router-link to="/register" class="text-indigo-600 hover:text-indigo-800 transition-colors">
            Regista-te aqui
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: '',
  password: '',
})

const handleSubmit = async () => {
  try {
    const user = await authStore.login(formData.value)
    toast.success(`Bem-vinda de volta, ${user.name}!`)
    router.push('/')
  } catch (e) {
    toast.error('Erro ao iniciar sessão. Verifica os teus dados.')
  }
}
</script>
