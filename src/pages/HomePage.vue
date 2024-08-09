<template>
  <div
    :style="{ height: 'calc(100vh - 5rem)' }"
    class="flex flex-col gap-5 items-center justify-center bg-black text-white"
  >
    <h1 class="text-9xl font-extrabold text-[#F5F5F7]">Delivery app</h1>
    <p class="text-2xl font-medium">
      Welcome and explore more to the navigation application
    </p>
    <div class="flex items-center gap-5 text-xl">
      <button class="px-6 py-4 bg-[#0071E3] rounded-full">Leann More</button>
      <router-link to="/rider">
        <button
          class="px-6 py-4 border border-[#0071E3] text-[#0071E3] rounded-full"
        >
          Try Free
        </button>
      </router-link>
    </div>
  </div>
</template>

<script setup></script>
