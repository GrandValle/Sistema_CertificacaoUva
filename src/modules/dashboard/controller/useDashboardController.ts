"use client";

import { useMemo, useState } from "react";
import {
    systemCategories,
    systems,
    type SystemDefinition,
} from "@/modules/dashboard/model/systems";

export type DashboardCategoryId = (typeof systemCategories)[number]["id"];

function matchesSystemQuery(system: SystemDefinition, query: string) {
    return (
        system.title.toLowerCase().includes(query) ||
        system.description.toLowerCase().includes(query) ||
        (system.primaryCode && system.primaryCode.toLowerCase().includes(query))
    );
}

export function useDashboardController() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<DashboardCategoryId>("all");

    const filteredSystems = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return systems.filter((system) => {
            const matchesCategory =
                selectedCategory === "all" || system.category === selectedCategory;
            const matchesSearch =
                query.length === 0 || matchesSystemQuery(system, query);

            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);

    return {
        systems,
        systemCategories,
        searchTerm,
        selectedCategory,
        filteredSystems,
        setSearchTerm,
        setSelectedCategory,
    };
}