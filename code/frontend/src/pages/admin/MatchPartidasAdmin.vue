<template>
  <div class="max-w-6xl mx-auto py-10">

    <!-- NAVBAR ADMIN -->
    <div class="flex gap-4 justify-center mb-10">
      <RouterLink
        to="/administration"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Utilizadores
      </RouterLink>

      <RouterLink
        to="/admin/transacoes"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg"
      >
        Transações
      </RouterLink>

      <RouterLink
        to="/admin/match-partidas"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Match Partidas
      </RouterLink>
    </div>
   </div> 
</template>