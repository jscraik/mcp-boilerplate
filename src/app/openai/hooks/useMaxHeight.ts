import { useOpenAIGlobal } from './useOpenAIGlobal'

export const useMaxHeight = (): number | undefined => {
	return useOpenAIGlobal('maxHeight')
}
