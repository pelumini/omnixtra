# Loading & Feedback Standard

OmniXtra uses one interaction-feedback pattern across new product surfaces.

1. Content and navigation loading use App Router `loading.tsx` boundaries and Suspense-ready skeletons. Skeletons should show the shape of the incoming content; bare spinners are not used for page content.
2. Action and mutation pending states use framework-native pending signals where available, such as `useFormStatus`, `useTransition`, or React Hook Form submission state. These feed the shared pending-aware `SubmitButton`, which disables the action and shows contextual copy such as `Creating...`, `Saving...`, or `Working...` with an inline spinner.
3. Result feedback uses the shared toast wrapper backed by Sonner. Mutations show success or error toasts for what happened. Field-level API envelope mapping remains the source of truth for what is wrong with input, and forms are disabled while pending.
4. The academy logo in authenticated shells is clickable and context-aware: it shows academy identity and links back to the admin/home context.

The shared `Field`, `TextareaField`, `SelectField`, `FormError`, and `SubmitButton` primitives remain the form feedback foundation.
