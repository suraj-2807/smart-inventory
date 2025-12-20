import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./services/firebase";
import "./services/cloudinary";
createRoot(document.getElementById("root")).render(<App />);
