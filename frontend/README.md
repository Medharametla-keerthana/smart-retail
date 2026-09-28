# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Smart Fleet Logistics

The React/Vite frontend is in `src/`; the Express and MongoDB backend is in `backend/`. Vercel serves the frontend and routes `/api/*` requests to the Express function in `api/`.

### Local development

Install dependencies from the repository root with `npm install`. Create `backend/.env` using `backend/.env.example` as a guide, with a real MongoDB connection string and a private random JWT secret. Run `npm run dev` and `npm run dev:backend` in separate terminals. Vite proxies `/api` to the backend on port 5000.

### Vercel deployment

Import this GitHub repository into Vercel with the project root set to `.`. Vercel uses `npm run build` and publishes `dist/`; API requests are handled by `api/[...path].js`.

Set `MONGO_URI` to your MongoDB connection string and `JWT_SECRET` to a long random secret in Vercel project settings for Production and any Preview environments that need a working API. Ensure MongoDB allows connections from Vercel, then redeploy. Do not commit `backend/.env` or expose secrets through frontend `VITE_` variables.
