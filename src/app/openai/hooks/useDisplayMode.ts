import { type DisplayMode } from '../types'
import { useOpenAIGlobal } from './useOpenAIGlobal'

export const useDisplayMode = (): DisplayMode | undefined => {
	return useOpenAIGlobal('displayMode')
}
