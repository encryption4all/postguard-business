import { db } from '$lib/server/db';
import { users, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function findUserByEmail(email: string) {
	const result = await db
		.select({
			user: users,
			org: organizations
		})
		.from(users)
		.innerJoin(organizations, eq(users.orgId, organizations.id))
		.where(eq(users.email, email.toLowerCase()))
		.limit(1);
	return result[0] ?? null;
}

export async function listOrgUsers(orgId: string) {
	return db.select().from(users).where(eq(users.orgId, orgId));
}

export async function addUser(
	orgId: string,
	email: string,
	fullName: string,
	phone: string | null
) {
	const [user] = await db
		.insert(users)
		.values({
			email: email.toLowerCase(),
			fullName,
			phone,
			orgId
		})
		.returning();
	return user;
}

export async function removeUser(userId: string, orgId: string) {
	// Check this user isn't the contact person
	const [org] = await db
		.select({ contactUserId: organizations.contactUserId })
		.from(organizations)
		.where(eq(organizations.id, orgId))
		.limit(1);

	if (org?.contactUserId === userId) {
		throw new Error('Cannot remove the contact person. Assign a different contact person first.');
	}

	await db.delete(users).where(and(eq(users.id, userId), eq(users.orgId, orgId)));
}

export async function setContactPerson(orgId: string, userId: string) {
	// Verify the user belongs to this org
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(and(eq(users.id, userId), eq(users.orgId, orgId)))
		.limit(1);

	if (!user) {
		throw new Error('User does not belong to this organization.');
	}

	await db
		.update(organizations)
		.set({ contactUserId: userId, updatedAt: new Date() })
		.where(eq(organizations.id, orgId));
}
