<script setup lang="ts">
const {
  cancelInstall,
  showInstallPrompt,
  install,
} = installPwa()
</script>

<template>
  <div
    v-if="showInstallPrompt"
    class="pwa-toast"
    aria-labelledby="toast-message"
    role="alert"
  >
    <div class="message">
      <span id="toast-message">
        Install PWA
      </span>
    </div>
    <div class="buttons">
      <button type="button" class="reload" @click="install()">
        Install
      </button>
      <button type="button" @click="cancelInstall()">
        Don't show again
      </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  display: grid;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast .buttons {
  display: flex;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
.pwa-toast button.reload {
  display: block;
}
</style>
