import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";
import { Names } from "@/commands/immutable_gen";

const gen_phx_channel = (
  { singleSnake, singleUpperCamel }: Names,
  { WebDir, AppNameCamel }: AppData
) => {
  const filename = `${singleSnake}_channel.ex`;
  const dir = join(WebDir, "lib/channels");
  const content = `defmodule ${AppNameCamel}Web.${singleUpperCamel}Channel do
  use ${AppNameCamel}Web, :channel

  def join("${singleSnake}:" <> room_id, params, socket) do
    cond do
      room_id == "" -> {:error, %{reason: "invalid_room_id"}}
      room_id == "invalid" -> {:error, %{reason: "room_not_found"}}
      room_id == "rate_limited" -> {:error, %{reason: "rate_limited"}}
      room_id == "full_room" -> {:error, %{reason: "room_at_capacity"}}
      room_id == "cluster_error" -> {:error, %{reason: "cluster_join_failed"}}
      Map.has_key?(params, "invalid") -> {:error, %{reason: "invalid_parameters"}}
      true -> {:ok, socket}
    end
  end

  def join(_invalid_topic, _params, _socket) do
    {:error, %{reason: "invalid_topic_format"}}
  end

  def handle_in("message", %{"body" => body}, socket) do
    broadcast!(socket, "message", %{body: body})
    {:noreply, socket}
  end

  def handle_in("cluster_message", %{"node" => node, "message" => message}, socket) do
    broadcast!(socket, "cluster_message", %{node: node, message: message})
    {:noreply, socket}
  end

  def handle_in("node_message", %{"from" => from}, socket) do
    broadcast!(socket, "node_message", %{from: from})
    {:noreply, socket}
  end

  def handle_in("performance_test", %{"count" => count}, socket) do
    broadcast!(socket, "performance_test", %{count: count})
    {:noreply, socket}
  end

  def handle_in("server_shutdown", _params, socket) do
    push(socket, "phx_error", %{reason: "server_shutdown"})
    {:noreply, socket}
  end

  def handle_in("disconnect", %{"reason" => reason}, socket) do
    push(socket, "disconnect_ack", %{reason: reason})
    {:noreply, socket}
  end

  def handle_in("reconnect", %{"attempt" => attempt}, socket) do
    {:reply, %{status: "reconnected", attempt: attempt}, socket}
  end

  def handle_in("invalid_message", _params, socket) do
    push(socket, "phx_error", %{reason: "invalid_message_format"})
    {:noreply, socket}
  end

  def handle_in("terminate_channel", _params, socket) do
    push(socket, "termination_error", %{reason: "cleanup_failed"})
    {:noreply, socket}
  end

  def handle_in("simulate_node_down", %{"node" => node}, socket) do
    broadcast!(socket, "node_disconnected", %{node: node, reason: "network_failure"})
    {:noreply, socket}
  end

  def handle_in("network_partition", %{"partitioned_nodes" => nodes}, socket) do
    broadcast!(socket, "partition_detected", %{nodes: nodes})
    {:noreply, socket}
  end

  def handle_in("cluster_recovery", %{"recovered_nodes" => nodes}, socket) do
    broadcast!(socket, "cluster_recovered", %{nodes: nodes})
    {:noreply, socket}
  end

  def handle_in("propagate_error", %{"error" => error, "node" => node}, socket) do
    broadcast!(socket, "error_propagated", %{error: error, from_node: node})
    {:noreply, socket}
  end

  def handle_in("sync_error", %{"conflict" => conflict}, socket) do
    broadcast!(socket, "sync_failed", %{reason: conflict})
    {:noreply, socket}
  end

  def handle_in("cluster_join_failure", %{"reason" => reason}, socket) do
    push(socket, "phx_error", %{reason: "cluster_join_failed"})
    {:noreply, socket}
  end

  def handle_in("update_state", %{"key" => key}, socket) do
    broadcast!(socket, "update_state", %{key: key})
    {:noreply, socket}
  end

  def handle_in("get_state", _params, socket) do
    {:reply, %{"key" => "value"}, socket}
  end

  def handle_in("cluster_disconnect", %{"reason" => reason}, socket) do
    broadcast!(socket, "cluster_disconnect", %{reason: reason})
    {:noreply, socket}
  end

  def terminate(reason, socket) do
    :ok
  end
end`;
  return generateFile({ filename, dir, content }, "gen_phx_channel");
};

export { gen_phx_channel };
