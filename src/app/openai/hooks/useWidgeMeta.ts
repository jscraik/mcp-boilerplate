import { useOpenAIGlobal } from './useOpenAIGlobal'

export function useWidgetMeta<T extends Record<string, unknown>>(): {
	data: T | undefined
	isLoading: boolean
} {
	// Try with just T generic - let K be inferred from the argument
	const metadata = useOpenAIGlobal<{ Metadata: T }, 'toolResponseMetadata'>('toolResponseMetadata')

	if (metadata) {
		return {
			data: metadata,
			isLoading: false,
		}
	}

	return { data: undefined, isLoading: true }
}
