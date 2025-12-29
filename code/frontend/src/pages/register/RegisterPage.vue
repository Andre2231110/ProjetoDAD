<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Join the game and start playing
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input id="name" v-model="formData.name" type="text" required placeholder="John Doe" />
          </div>

          <div>
            <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">
              Nickname
            </label>
            <Input id="nickname" v-model="formData.nickname" type="text" required placeholder="KingOfBisca" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <Input id="email" v-model="formData.email" type="email" required placeholder="you@example.com" />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input id="password" v-model="formData.password" type="password" required placeholder="••••••••" />
          </div>

          <div>
            <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <Input
              id="password_confirmation"
              v-model="formData.password_confirmation"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          <div>
            <label for="avatar" class="block text-sm font-medium text-gray-700 mb-1">
              Avatar (Optional)
            </label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

        </div>

        <div>
          <Button type="submit" class="w-full"> Sign up </Button>
        </div>

        <div class="text-center text-sm">
          <span class="text-gray-600">Already have an account? </span>
          <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
            Sign in
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
  password_confirmation: '' // necessário para a validação confirmed no backend
})

const avatarFile = ref(null)

const handleFileChange = (event) => {
  avatarFile.value = event.target.files[0]
}

const handleSubmit = async () => {
  // validação no front-end
  if (formData.value.password !== formData.value.password_confirmation) {
    toast.error('Passwords do not match')
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
    loading: 'Creating account...',
    success: (user) => {
      router.push('/')
      return `Welcome aboard, ${user.name}!`
    },
    error: (error) => {
      const msg = error.response?.data?.message || 'Error creating account'
      return `[API] ${msg}`
    },
  })
}
</script>
