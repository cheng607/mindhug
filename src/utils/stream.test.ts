import { describe, expect, it } from 'vitest'
import { generateUniqueId, mergeStreamChunk } from './stream'

describe('mergeStreamChunk', () => {
    it('returns incoming when existing is empty', () => {
        expect(mergeStreamChunk('', 'hello')).toBe('hello')
    })

    it('returns existing when incoming is empty', () => {
        expect(mergeStreamChunk('hello', '')).toBe('hello')
    })

    it('uses cumulative chunk when incoming starts with existing', () => {
        expect(mergeStreamChunk('hel', 'hello')).toBe('hello')
    })

    it('keeps existing when it already ends with incoming', () => {
        expect(mergeStreamChunk('hello', 'lo')).toBe('hello')
    })

    it('merges overlapping suffix/prefix', () => {
        expect(mergeStreamChunk('你好', '好世界')).toBe('你好世界')
    })

    it('appends disjoint chunks', () => {
        expect(mergeStreamChunk('abc', 'def')).toBe('abcdef')
    })
})

describe('generateUniqueId', () => {
    it('returns monotonically increasing ids', () => {
        const a = generateUniqueId()
        const b = generateUniqueId()
        expect(b).toBeGreaterThan(a)
    })
})
