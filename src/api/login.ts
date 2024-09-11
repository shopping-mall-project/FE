import axios from "axios";
import { Login } from "../../types/login";

export default async function login(loginData: Login) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}users/login`, loginData, {
    withCredentials: true,
  });
  return response.data;
}