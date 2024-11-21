import axios from "axios";

export default async function getReview(id:string) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}comments/${id}`, {
    withCredentials: true,
  });
  return response.data;
}