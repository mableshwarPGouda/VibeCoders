import { createFileRoute } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";

export const Route = createFileRoute("/_app/chats")({
  component: () => <ChatList />,
});
