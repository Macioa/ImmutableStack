import { dir } from "console";
import { generateFile } from "../..";
import { ImmutableGenerator } from "../../../immutable_gen";
import { join } from "../../../utils/path";

const gen_demo_component_styles = ({
  AppData: { LibDir },
}: ImmutableGenerator) => {
  const filename = "styles.css";
  const dir = join(LibDir, "lib/typescript/components");
  const content = `.form-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-container form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}
.form-container h4,
.form-container label {
  color: #000;
}

.form-container input,
.form-container textarea,
.form-container select {
  padding: 0.7rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.form-submit-btn {
  align-self: center;
  padding: 0.9rem 2.5rem;
  background: linear-gradient(90deg, #4f8cff 0%, #235390 100%);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(79,140,255,0.15);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  margin-top: 1.5rem;
}

.form-submit-btn:hover {
  background: linear-gradient(90deg, #235390 0%, #4f8cff 100%);
  transform: translateY(-2px) scale(1.03);
}

.styled-list {
  width: 100%;
  max-width: 400px;
  margin: 2rem auto;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
}

.styled-list-item {
  padding: 0.7rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  margin: 0 0.5rem;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-shadow: 0 1px 4px rgba(79,140,255,0.07);
  display: flex;
  align-items: center;
}

.styled-list-item:hover {
  border-color: #4f8cff;
  box-shadow: 0 2px 8px rgba(79,140,255,0.15);
}

.channel-status-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  color: #000;
  transition: background 0.2s, border 0.2s, box-shadow 0.2s;
}

.channel-status-connected {
  background: #7fffaf;
  border: 2px solid #137a2b;
  box-shadow: 0 4px 24px rgba(19, 122, 43, 0.18);
}

.channel-status-disconnected {
  background: #a9002a;
  border: 2px solid #ff4d6d;
  box-shadow: 0 4px 24px rgba(255, 77, 109, 0.18);
  color: #fff;
}`;
  return generateFile({ filename, dir, content });
};

export { gen_demo_component_styles };
