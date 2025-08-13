"use client"

import React from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-6 h-6 text-red-500" />,
          iconBg: "bg-red-100",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: "bg-amber-100",
          confirmButton: "bg-amber-600 hover:bg-amber-700 text-white"
        }
      case "info":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-500" />,
          iconBg: "bg-blue-100",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${styles.iconBg}`}>
                {styles.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Message */}
          <div className="mb-6 ml-11">
            <p className="text-slate-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 py-2 font-medium transition-colors ${styles.confirmButton}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
