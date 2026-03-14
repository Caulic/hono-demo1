import { env } from "@hono-demo1/env/web";
import { Button } from "@hono-demo1/ui/components/button";
import { Input } from "@hono-demo1/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

import type { Route } from "./+types/_index";

type GitHubUser = {
	id: number;
	login: string;
	name: string | null;
	email: string | null;
	avatarUrl: string | null;
	bio: string | null;
	location: string | null;
	publicRepos: number | null;
	followers: number | null;
	following: number | null;
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "hono-demo1" },
		{ name: "description", content: "hono-demo1 is a web application" },
	];
}

export default function Home() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	const queryClient = useQueryClient();

	const [addToken, setAddToken] = useState("");
	const [deleteToken, setDeleteToken] = useState("");

	const usersQuery = useQuery({
		queryKey: ["github-users"],
		queryFn: async () => {
			const res = await fetch(`${env.VITE_SERVER_URL}/api/users`);
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json() as Promise<{ ok: boolean; users: GitHubUser[] }>;
		},
	});

	const addMutation = useMutation({
		mutationFn: async (token: string) => {
			const res = await fetch(`${env.VITE_SERVER_URL}/api/add_user`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "Failed to add user");
			return data as { login: string; id: number };
		},
		onSuccess: (data) => {
			toast.success(`已添加用户 ${data.login}`);
			queryClient.invalidateQueries({ queryKey: ["github-users"] });
			setAddToken("");
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: async (token: string) => {
			const res = await fetch(`${env.VITE_SERVER_URL}/api/delete_user`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "Failed to delete user");
			return data as { login: string; id: number };
		},
		onSuccess: (data) => {
			toast.success(`已删除用户 ${data.login}`);
			queryClient.invalidateQueries({ queryKey: ["github-users"] });
			setDeleteToken("");
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return (
		<div className="container mx-auto max-w-3xl space-y-4 px-4 py-6">
			{/* API Status */}
			<section className="rounded-lg border p-4">
				<h2 className="mb-2 font-medium">API Status</h2>
				<div className="flex items-center gap-2">
					<div
						className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-muted-foreground text-sm">
						{healthCheck.isLoading
							? "Checking..."
							: healthCheck.data
								? "Connected"
								: "Disconnected"}
					</span>
				</div>
			</section>

			{/* Add User */}
			<section className="space-y-3 rounded-lg border p-4">
				<h2 className="font-medium">添加 GitHub 用户</h2>
				<div className="flex gap-2">
					<Input
						type="password"
						placeholder="输入 GitHub Token"
						value={addToken}
						onChange={(e) => setAddToken(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && addToken.trim()) {
								addMutation.mutate(addToken.trim());
							}
						}}
					/>
					<Button
						onClick={() => addMutation.mutate(addToken.trim())}
						disabled={!addToken.trim() || addMutation.isPending}
					>
						{addMutation.isPending ? "添加中..." : "添加"}
					</Button>
				</div>
			</section>

			{/* Delete User */}
			<section className="space-y-3 rounded-lg border p-4">
				<h2 className="font-medium">删除 GitHub 用户</h2>
				<div className="flex gap-2">
					<Input
						type="password"
						placeholder="输入 GitHub Token"
						value={deleteToken}
						onChange={(e) => setDeleteToken(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && deleteToken.trim()) {
								deleteMutation.mutate(deleteToken.trim());
							}
						}}
					/>
					<Button
						variant="destructive"
						onClick={() => deleteMutation.mutate(deleteToken.trim())}
						disabled={!deleteToken.trim() || deleteMutation.isPending}
					>
						{deleteMutation.isPending ? "删除中..." : "删除"}
					</Button>
				</div>
			</section>

			{/* Users List */}
			<section className="space-y-3 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<h2 className="font-medium">
						已保存用户
						{usersQuery.data && (
							<span className="ml-2 font-normal text-muted-foreground text-sm">
								({usersQuery.data.users.length})
							</span>
						)}
					</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							queryClient.invalidateQueries({ queryKey: ["github-users"] })
						}
						disabled={usersQuery.isFetching}
					>
						{usersQuery.isFetching ? "刷新中..." : "刷新"}
					</Button>
				</div>

				{usersQuery.isLoading && (
					<p className="text-muted-foreground text-sm">加载中...</p>
				)}
				{usersQuery.isError && (
					<p className="text-destructive text-sm">加载失败</p>
				)}
				{usersQuery.data?.users.length === 0 && (
					<p className="text-muted-foreground text-sm">暂无数据</p>
				)}

				<div className="space-y-2">
					{usersQuery.data?.users.map((user) => (
						<div
							key={user.id}
							className="flex items-center gap-3 rounded-md border p-3"
						>
							{user.avatarUrl && (
								<img
									src={user.avatarUrl}
									alt={user.login}
									className="h-10 w-10 shrink-0 rounded-full"
								/>
							)}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="font-medium text-sm">{user.login}</span>
									{user.name && (
										<span className="truncate text-muted-foreground text-sm">
											{user.name}
										</span>
									)}
								</div>
								{user.bio && (
									<p className="mt-0.5 truncate text-muted-foreground text-xs">
										{user.bio}
									</p>
								)}
								<div className="mt-1 flex gap-3 text-muted-foreground text-xs">
									{user.location && <span>{user.location}</span>}
									<span>仓库 {user.publicRepos}</span>
									<span>粉丝 {user.followers}</span>
									<span>关注 {user.following}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
