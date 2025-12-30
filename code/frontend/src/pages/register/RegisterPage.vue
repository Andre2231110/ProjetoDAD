<template>
  <div class="container mx-auto p-6 flex min-h-[90vh] items-center justify-center">

    <div class="w-full max-w-[80%] mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-10 space-y-8">

      <div class="text-center md:text-left">
        <h2 class="text-4xl font-black text-indigo-900 tracking-tight uppercase">
          Criar Conta
        </h2>
        <p class="mt-2 text-sm font-medium text-slate-400">
          Junta-te ao jogo e começa a ganhar moedas! 🃏
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div class="space-y-1">
            <label for="name" class="block text-base font-bold text-indigo-600 ml-1">
              Nome Completo
            </label>
            <Input id="name" v-model="formData.name" type="text"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required placeholder="Teu nome aqui" />
          </div>

          <div class="space-y-1">
            <label for="nickname" class="block text-base font-bold text-indigo-600 ml-1">
              Alcunha (Nickname)
            </label>
            <Input id="nickname" v-model="formData.nickname" type="text"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required placeholder="Ex: MestreDaBisca" />
          </div>

          <div class="md:col-span-2 space-y-1">
            <label for="email" class="block text-base font-bold text-indigo-600 ml-1">
              Endereço de Email
            </label>
            <Input id="email" v-model="formData.email" type="email"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required placeholder="exemplo@email.com" />
          </div>

          <div class="space-y-1">
            <label for="password" class="block text-base font-bold text-indigo-600 ml-1">
              Palavra-passe
            </label>
            <Input id="password" v-model="formData.password" type="password"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required placeholder="••••••••" />
          </div>

          <div class="space-y-1">
            <label for="password_confirmation" class="block text-base font-bold text-indigo-600 ml-1">
              Confirmar Palavra-passe
            </label>
            <Input id="password_confirmation" v-model="formData.password_confirmation"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              type="password" required placeholder="••••••••" />
          </div>

          <div class="md:col-span-2 space-y-1">
            <label for="avatar" class="block text-base font-bold text-indigo-600 ml-1">
              Foto de Perfil (Opcional)
            </label>
            <Input id="avatar" type="file" accept="image/*" @change="handleFileChange"
              class="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 h-auto p-2"
            />
          </div>
        </div>

        <div class="pt-6">
          <Button type="submit" class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-100 rounded-xl transition-all active:scale-95 uppercase tracking-widest cursor-pointer">
            Criar Conta
          </Button>
        </div>

        <div class="text-center text-sm font-bold">
          <span class="text-slate-400">Já tens uma conta? </span>
          <router-link to="/login" class="text-indigo-600 hover:text-indigo-800 transition-colors">
            Inicia sessão aqui
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
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const avatarFile = ref(null)

const handleFileChange = (event) => {
  avatarFile.value = event.target.files[0]
}

const handleSubmit = async () => {
  if (formData.value.password !== formData.value.password_confirmation) {
    toast.error('As palavras-passe não coincidem!')
    return
  }

  const dataToSend = new FormData()
  dataToSend.append('name', formData.value.name)
  dataToSend.append('nickname', formData.value.nickname)
  dataToSend.append('email', formData.value.email)
  dataToSend.append('password', formData.value.password)
  dataToSend.append('password_confirmation', formData.value.password_confirmation)
  if (avatarFile.value) dataToSend.append('avatar', avatarFile.value)

  toast.promise(authStore.register(dataToSend), {
    loading: 'A criar a tua conta...',
    success: (user) => {
      router.push('/')
      return `Bem-vinda a bordo, ${user.name}!`
    },
    error: (error) => {
      const msg = error.response?.data?.message || 'Erro ao criar conta'
      return `[Erro] ${msg}`
    },
  })
}
</script>
