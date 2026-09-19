# Form Standard Inventory

All web forms use the OmniXtra form standard: React Hook Form, `zodResolver`, shared Zod schemas composed from validation primitives, `mode: "onTouched"`, `reValidateMode: "onChange"`, `noValidate`, shared `Field`/`TextareaField`/`SelectField`, `FormError`, pending-aware `SubmitButton`, central constraint-to-message mapping, and server-envelope field mapping through `useFormSubmit`.

| Form | Location | Before `NEXT_TASK_2` | After `NEXT_TASK_2` |
|---|---|---|---|
| Create academy | `web/src/components/forms/create-academy-form.tsx` | Conformant reference | Conformant |
| Sign in | `web/src/components/auth/sign-in-view.tsx` | Mostly conformant, but required messages fell back to generic text and fieldset pending disable was missing | Conformant |
| Accept invitation | `web/src/components/auth/accept-invitation-view.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Invitation code fallback | `web/src/components/auth/accept-invitation-view.tsx` | Mostly conformant, pending fieldset incomplete | Conformant |
| Create course + first lesson | `web/src/components/admin/admin-course-list.tsx` | Conformant reference from authoring slice | Conformant |
| Add lesson | `web/src/components/admin/course-detail.tsx` | Conformant reference from authoring slice | Conformant |
| Invite member | `web/src/components/admin/members-view.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Legacy course details | `web/src/components/admin/course-builder.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Legacy media metadata | `web/src/components/admin/course-builder.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Legacy section create | `web/src/components/admin/course-builder.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Legacy lesson create | `web/src/components/admin/course-builder.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Legacy block create | `web/src/components/admin/course-builder.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Quiz attempt | `web/src/components/learning/learner-course-player.tsx` | Mostly conformant, pending fieldset/toast feedback incomplete | Conformant |
| Tutor question | `web/src/components/learning/tutor-panel.tsx` | RHF/Zod/shared controls, custom async queue flow; missing toast feedback and disabled fieldset | Conformant |
