'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { CLASS_TYPES, getClassType } from '@/lib/class-types'

interface CreateClassModalProps {
  open:        boolean
  onClose:     () => void
  teacherId:   string
}

function randomJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function CreateClassModal({ open, onClose, teacherId }: CreateClassModalProps) {
  const { supabase } = useSupabase()
  const router       = useRouter()
  const { toast }    = useToast()

  const [name,        setName]        = useState('')
  const [level,       setLevel]       = useState(CLASS_TYPES[0]?.id) // Default to the first class type (Grade 7)
  const selectedType = getClassType(level)
  const [grade,       setGrade]       = useState(selectedType.defaultGrade)
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.from('classes').insert({
      name,
      teacher_id:  teacherId,
      grade,
      level,                     // ClassType.id — used by getClassType() everywhere
      description,
      join_code:   randomJoinCode(),
    }).select('id').single()

    setLoading(false)

    if (error) {
      console.error('Supabase error creating class:', error); // Add detailed console logging
      toast.error(error.message)
    } else {
      toast.success(`Class "${name}" created!`)
      onClose()
      setName('')
      setDescription('')
      if (data?.id) router.push(`/teacher/class/${data.id}`)
      router.refresh()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Class" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-fg-dim mb-1.5">Class type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2"> {/* Adjusted grid for more options */}
            {CLASS_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setLevel(type.id)
                  setGrade(type.defaultGrade)
                }}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  level === type.id
                    ? 'border-accent bg-accent/10'
                    : 'border-b2 bg-s2 hover:border-b3'
                }`}
              >
                <span className="block text-sm font-semibold text-fg">{type.shortLabel}</span>
                <span className="block text-xs text-fg-faint mt-1">{type.gradeRange}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-fg-dim mb-1.5">Class name</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`e.g. ${selectedType.shortLabel} Computer Science - Paper 2`}
            className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm placeholder:text-fg-faint focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-fg-dim mb-1.5">Year / Grade</label>
          <select
            value={grade}
            onChange={e => setGrade(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-s2 border border-b2 text-fg text-sm focus:border-accent focus:outline-none"
          >
            {['6','7','8','9','10','11','12','13'].map(g => (
              <option key={g} value={g}>Grade / Year {g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-fg-dim mb-1.5">Suggested resources</label>
          <div className="rounded-lg border border-b2 bg-s2 p-3">
            <ul className="space-y-1.5 text-xs text-fg-dim">
              {selectedType.resourceSuggestions.map(resource => (
                <li key={resource}>- {resource}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label className="block text-xs text-fg-dim mb-1.5">Description <span className="text-fg-faint">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What topics will this class cover?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-s2 border border-b2 text-fg text-sm placeholder:text-fg-faint focus:border-accent focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            Create Class
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
