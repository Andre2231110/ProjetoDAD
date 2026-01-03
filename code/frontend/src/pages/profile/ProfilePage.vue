<template>
  <div class="container mx-auto p-6 space-y-8">

    <div class="max-w-[80%] mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-10">

      <h1 class="text-3xl font-bold mb-8 text-center text-indigo-700">Meu Perfil</h1>

      <!-- Avatar -->
      <div class="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div class="relative flex-shrink-0">
          <img :src="avatarPreview || computedAvatar" alt="Avatar"
            class="w-32 h-32 rounded-full border-4 border-indigo-600 object-cover" />
        </div>

        <div class="space-y-1 w-full">
          <label class="block text-base font-bold text-indigo-600 ml-1">
            Avatar
          </label>

          <div class="w-full border-2 border-slate-50 rounded-xl p-4
             focus-within:ring-2 focus-within:ring-indigo-400
             outline-none transition-all shadow-sm">
            <input id="avatar" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />

            <label for="avatar" class="cursor-pointer px-4 py-2 rounded-lg
               bg-indigo-600 text-white text-sm font-bold
               hover:bg-indigo-700 transition whitespace-nowrap">
              Escolher ficheiro
            </label>

            <span class="ml-3 text-sm text-gray-500 truncate">
              {{ avatarFile ? avatarFile.name : 'Nenhum ficheiro selecionado' }}
            </span>
          </div>
        </div>
      </div>

       <!--<pre class="text-xs text-red-500">
      {{ authStore.currentUser }}
    </pre>-->
      <form @submit.prevent="handleUpdateProfile" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Nome</label>
            <input v-model="form.name" type="text"
              class="w-full border-2 border-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 outline-none transition-all shadow-sm"
              required />
          </div>

          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Nickname</label>
            <input v-model="form.nickname" type="text"
              class="w-full border-2 border-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 outline-none transition-all shadow-sm"
              required />
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Email</label>
            <input v-model="form.email" type="email"
              class="w-full border-2 border-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 outline-none transition-all shadow-sm"
              required />
          </div>

          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Nova Palavra-passe</label>
            <input v-model="form.password" type="password" placeholder="Deixe em branco para manter"
              class="w-full border-2 border-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 outline-none transition-all shadow-sm" />
          </div>

          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Confirmar Palavra-passe</label>
            <input v-model="form.password_confirmation" type="password" placeholder="Repita a nova senha"
              class="w-full border-2 border-slate-50 rounded-xl p-4 focus:ring-2 focus:ring-indigo-400 outline-none transition-all shadow-sm" />
          </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center mt-12 gap-6 pt-8 border-t border-slate-50">
          <button type="submit"
            class="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer">
            Atualizar Perfil
          </button>

          <button type="button" @click="deleteAccount" :disabled="authStore.currentUser?.type === 'A'"
            class="w-full md:w-auto px-10 py-4 border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
            Excluir Conta
          </button>
        </div>
      </form>
      <!-- Modal de exclusão -->
      <transition name="fade">
        <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center z-50 bg-[rgba(0,0,0,0.35)]">
          <div class="bg-white rounded-2xl p-6 w-96 shadow-xl relative">
            <h2 class="text-2xl font-bold mb-4 text-red-600">Confirmar Exclusão</h2>
            <p class="mb-4 text-gray-700 text-sm">
              Esta ação é permanente e todos os coins serão perdidos.
              Digite sua senha para confirmar a exclusão da conta.
            </p>

            <input v-model="password" type="password" placeholder="Senha"
              class="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-400 outline-none" />

            <div class="flex justify-end gap-2">
              <button @click="showDeleteModal = false"
                class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button @click="confirmDelete"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Toast de mensagens -->
      <transition name="slide-fade">
        <div v-if="showToast" :class="[
          'fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white font-medium',
          toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
        ]">
          {{ toastMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const API_URL = `http://${import.meta.env.VITE_API_DOMAIN}`



const computedAvatar = computed(() => {
  const avatar = authStore.currentUser?.current_avatar
  return avatar ? `${API_URL}/storage/photos_avatars/${avatar}` : '/default.jpg'
})

const form = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const avatarFile = ref(null)
const avatarPreview = ref(null)

// Modal e senha
const showDeleteModal = ref(false)
const password = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const triggerToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// Handle avatar change
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

// Atualizar perfil
const handleUpdateProfile = async () => {
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('nickname', form.value.nickname)
    formData.append('email', form.value.email)
    if (form.value.password) formData.append('password', form.value.password)
    if (form.value.password_confirmation)
      formData.append('password_confirmation', form.value.password_confirmation)
    if (avatarFile.value) formData.append('avatar', avatarFile.value)

    const data = await authStore.updateProfile(formData)
    triggerToast(data.message, 'success')

    // Atualiza o avatar local
    // 👇 MUITO IMPORTANTE
    authStore.currentUser.current_avatar = data.user.current_avatar

    avatarPreview.value = null
    avatarFile.value = null

    form.value.password = ''
    form.value.password_confirmation = ''
  } catch (err) {
    console.error(err)
    triggerToast(err.response?.data?.message || 'Erro ao atualizar perfil', 'error')
  }
}

// Delete account
const deleteAccount = () => {
  if (authStore.currentUser?.type === 'A') {
    triggerToast('Administradores não podem deletar sua própria conta.', 'error')
    return
  }
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!password.value) {
    triggerToast('Digite a senha para confirmar.', 'error')
    return
  }

  try {
    await authStore.deleteAccount(password.value)
    triggerToast('Conta deletada com sucesso.', 'success')
    showDeleteModal.value = false
    setTimeout(() => (window.location.href = '/login'), 1000)
  } catch (err) {
    console.error(err)
    triggerToast(err.response?.data?.message || err.message || 'Erro ao deletar conta', 'error')
  } finally {
    password.value = ''
  }
}

// Preenche form ao montar
onMounted(() => {
  const user = authStore.currentUser
  if (user) {
    form.value.name = user.name
    form.value.nickname = user.nickname
    form.value.email = user.email
    avatarPreview.value = null
  }
})

</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  transform: translateX(50px);
  opacity: 0;
}

.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-leave-to {
  transform: translateX(50px);
  opacity: 0;
}
</style>
