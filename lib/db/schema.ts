import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

// Better Auth tables
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
        .notNull()
        .references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
        .notNull()
        .references(() => user.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

// App-specific tables
export const videos = pgTable("videos", {
    id: text("id").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => user.id),
    youtubeUrl: text("youtubeUrl").notNull(),
    youtubeId: text("youtubeId").notNull(),
    title: text("title"),
    thumbnailUrl: text("thumbnailUrl"),
    transcript: text("transcript"),
    blogContent: text("blogContent"),
    userNotes: text("userNotes"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const actionablePoints = pgTable("actionable_points", {
    id: text("id").primaryKey(),
    videoId: text("videoId")
        .notNull()
        .references(() => videos.id),
    content: text("content").notNull(),
    category: text("category"), // 'action', 'remember', 'insight'
    timestamp: integer("timestamp"), // Timestamp in seconds where this point is discussed
    isCompleted: boolean("isCompleted").default(false),
    order: integer("order").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
});
