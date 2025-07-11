// frontend-shadcn/src/pages/admin/zones/columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui-admin/button"
import { Badge } from "@/components/ui-admin/badge"
import { Checkbox } from "@/components/ui-admin/checkbox"
import { ArrowUpDown, Edit, Calendar, Eye } from "lucide-react"
import { Link } from "react-router-dom";

import { type Zone } from '@/types/types';