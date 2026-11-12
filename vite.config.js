import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ 
    plugins: [react()],
    base:'/Diagramme-de-Venn-et-lois-de-De-Morgan/'
});
