import axios from "axios";

interface AccountData {
  email: string;
  password: string;
}

export default async function deleteAccount(accountData: AccountData) {
  const response = await axios.delete(
    `${process.env.NEXT_PUBLIC_API_URL}users/delete-account`,
    { data: accountData, withCredentials: true }
  );
  return response;
}
