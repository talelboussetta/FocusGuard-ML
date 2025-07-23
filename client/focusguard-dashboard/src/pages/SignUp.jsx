import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SignUp() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        console.log("Webcam access granted");
        navigate("/focus");
      })
      .catch(() => alert("Please allow webcam access to continue"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <form 
        onSubmit={handleSubmit} 
        className="bg-gray-700 p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-center">Sign Up</h2>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 focus:outline-none"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 focus:outline-none"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 focus:outline-none"
          required
        />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg rounded-xl">
          Continue
        </Button>
      </form>
    </div>
  );
}