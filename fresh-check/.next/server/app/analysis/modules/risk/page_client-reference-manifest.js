_Last);
            auto _UResult = _RANGES _Rotate_unchecked(_RANGES _Unwrap_iter<_Se>(_STD move(_First)),
                _RANGES _Unwrap_iter<_Se>(_STD move(_Mid)), _RANGES _Unwrap_sent<_It>(_STD move(_Last)));

            return _RANGES _Rewrap_subrange<subrange<_It>>(_First, _STD move(_UResult));
        }

        template <forward_range _Rng>
            requires permutable<iterator_t<_Rng>>
        _STATIC_CALL_OPERATOR constexpr borrowed_subrange_t<_Rng> operator()(
            _Rng&& _Range, iterator_t<_Rng> _Mid) _CONST_CALL_OPERATOR {
            _STD _Adl_verify_range(_RANGES begin(_Range), _Mid);
            _STD _Adl_verify_range(_Mid, _RANGES end(_Range));
            auto _UResult = _RANGES _Rotate_unchecked(
                _Ubegin(_Range), _RANGES _Unwrap_range_iter<_Rng>(_STD move(_Mid)), _Uend(_Range));

            return _RANGES _Rewrap_subrange<borrowed_subrange_t<_Rng>>(_Mid, _STD move(_UResult));
        }
    };

    _EXPORT_STD inline constexpr _Rotate_fn rotate;
} // namespace ranges
#endif // _HAS_CXX20

_EXPORT_STD template <class _FwdIt, class _OutIt>
_CONSTEXPR20 _OutIt rotate_copy(_FwdIt _First, _FwdIt _Mid, _FwdIt _Last, _OutIt _Dest) {
    // copy rotating [_First, _Last)
    _STD _Adl_verify_range(_First, _Mid);
    _STD _Adl_verify_range(_Mid, _Last);
    _STD _Verify_ranges_do_not_overlap(_First, _Last, _Dest);
    const auto _UFirst = _STD _Get_unwrapped(_First);
    const auto _UMid   = _STD _Get_unwrapped(_Mid);
    const auto _ULast  = _STD _Get_unwrapped(_Last);
    auto _UDest        = _STD _Get_unwrapped_n(_Dest, _STD _Idl_distance<_FwdIt>(_UFirst, _ULast));
    _UDest             = _STD _Copy_unchecked(_UMid, _ULast, _UDest);
    _STD _Seek_wrapped(_Dest, _STD _Copy_unchecked(_UFirst, _UMid, _UDest));
    return _Dest;
}

#if _HAS_CXX17
_EXPORT_STD template <class _ExPo, class _FwdIt1, class _FwdIt2, _Enable_if_execution_policy_t<_ExPo> = 0>
_FwdIt2 rotate_copy(_ExPo&&, _FwdIt1 _First, _FwdIt1 _Mid, _FwdIt1 _Last, _FwdIt2 _Dest) noexcept /* terminates */ {
    // copy rotating [_First, _Last)
    // not parallelized as benchmarks show it isn't worth it
    _REQUIRE_PARALLEL_ITERATOR(_FwdIt1);
    _REQUIRE_CPP17_MUTABLE_ITERATOR(_FwdIt2);
    return _STD rotate_copy(_First, _Mid, _Last, _Dest);
}

#if _HAS_CXX20
namespace ranges {
    _EXPORT_STD template <class _In, class _Out>
    using rotate_copy_result = in_out_result<_In, _Out>;

    class _Rotate_copy_fn {
    public:
        template <forward_iterator _It, sentinel_for<_It> _Se, weakly_incrementable _Out>
            requires indirectly_copyable<_It, _Out>
        _STATIC_CALL_OPERATOR constexpr rotate_copy_result<_It, _Out> operator()(
            _It _First, _It _Mid, _Se _Last, _Out _Output) _CONST_CALL_OPERATOR {
            _STD _Adl_verify_range(_First, _Mid);
            _STD _Adl_verify_range(_Mid, _Last);
            auto _UFirst      = _RANGES _Unwrap_iter<_Se>(_STD move(_First));
            auto _ULast       = _RANGES _Unwrap_sent<_It>(_STD move(_Last));
            const auto _Count = _RANGES _Idl_distance<_It>(_UFirst, _ULast);
            auto _UResult     = _Rotate_copy_common(_STD move(_UFirst), _RANGES _Unwrap_iter<_Se>(_STD move(_Mid)),
                    _STD move(_ULast), _STD _Get_unwrapped_n(_STD move(_Output), _Count));

            _STD _Seek_wrapped(_First, _STD move(_UResult.in));
            _STD _Seek_wrapped(_Output, _STD move(_UResult.out));
            return {_STD move(_First), _STD move(_Output)};
        }

        template <forward_range _Rng, weakly_incrementable _Out>
            requires indirectly_copyable<iterator_t<_Rng>, _Out>
        _STATIC_CALL_OPERATOR constexpr rotate_copy_result<borrowed_iterator_t<_Rng>, _Out> operator()(
            _Rng&& _Range, iterator_t<_Rng> _Mid, _Out _Output) _CONST_CALL_OPERATOR {
            _STD _Adl_verify_range(_RANGES begin(_Range), _Mid);
            _STD _Adl_verify_range(_Mid, _RANGES end(_Range));
            const auto _Count = _RANGES _Idl_distance(_Range);
            auto _UResult     = _Rotate_copy_common(_Ubegin(_Range), _RANGES _Unwrap_range_iter<_Rng>(_STD move(_Mid)),
                    _Uend(_Range), _STD _Get_unwrapped_n(_STD move(_Output), _Count));
            _STD _Seek_wrapped(_Output, _STD move(_UResult.out));
            return {_RANGES _Rewrap_iterator(_Range, _STD move(_UResult.in)), _STD move(_Output)};
        }

    private:
        template <class _It, class _Se, class _Out>
        _NODISCARD static constexpr rotate_copy_result<_It, _Out> _Rotate_copy_common(
            _It _First, _It _Mid, _Se _Last, _Out _Output) {
            // Copy the content of [_Mid, _Last) and [_First, _Mid) to _Output
            _STL_INTERNAL_STATIC_ASSERT(forward_iterator<_It>);
            _STL_INTERNAL_STATIC_ASSERT(sentinel_for<_Se, _It>);
            _STL_INTERNAL_STATIC_ASSERT(weakly_incrementable<_Out>);
            _STL_INTERNAL_STATIC_ASSERT(indirectly_copyable<_It, _Out>);

            _STD _Verify_ranges_do_not_overlap(_First, _Last, _Output);

            auto _UResult1 = _RANGES _Copy_unchecked(_Mid, _STD move(_Last), _STD move(_Output));
            auto _UResult2 = _RANGES _Copy_unchecked(_STD move(_First), _STD move(_Mid), _STD move(_UResult1.out));
            return {_STD move(_UResult1.in), _STD move(_UResult2.out)};
        }
    };

    _EXPORT_STD inline constexpr _Rotate_copy_fn rotate_copy;
} // namespace ranges
#endif // _HAS_CXX20
#endif // _HAS_CXX17

template <class _Diff, class _Urng>
class _Rng_from_urng { // wrap a URNG as an RNG
public:
    using _Ty0 = make_unsigned_t<_Diff>;
    using _Ty1 = _Invoke_result_t<_Urng&>;

    using _Udiff = conditional_t<sizeof(_Ty1) < sizeof(_Ty0), _Ty0, _Ty1>;

    explicit _Rng_from_urng(_Urng& _Func)
        : _Ref(_Func), _Bits(CHAR_BIT * sizeof(_Udiff)), _Bmask(static_cast<_Udiff>(-1)) {
        for (; static_cast<_Udiff>((_Urng::max)() - (_Urng::min)()) < _Bmask; _Bmask >>= 1) {
            --_Bits;
        }
    }

    _Diff operator()(_Diff _Index) { // adapt _Urng closed range to [0, _Index)
        for (;;) { // try a sample random value
            _Udiff _Ret  = 0; // random bits
            _Udiff _Mask = 0; // 2^N - 1, _Ret is within [0, _Mask]

            while (_Mask < static_cast<_Udiff>(_Index - 1)) { // need more random bits
                _Ret <<= _Bits - 1; // avoid full shift
                _Ret <<= 1;
                _Ret |= _Get_bits();
                _Mask <<= _Bits - 1; // avoid full shift
                _Mask <<= 1;
                _Mask |= _Bmask;
            }

            // _Ret is [0, _Mask], _Index - 1 <= _Mask, return if unbiased
            if (_Ret / _Index < _Mask / _Index || _Mask % _Index == static_cast<_Udiff>(_Index - 1)) {
                return static_cast<_Diff>(_Ret % _Index);
            }
        }
    }

    _Udiff _Get_all_bits() {
        _Udiff _Ret = 0;

        for (size_t _Num = 0; _Num < CHAR_BIT * sizeof(_Udiff); _Num += _Bits) { // don't mask away any bits
            _Ret <<= _Bits - 1; // avoid full shift
            _Ret <<= 1;
            _Ret |= _Get_bits();
        }

        return _Ret;
    }

    _Rng_from_urng(const _Rng_from_urng&)            = delete;
    _Rng_from_urng& operator=(const _Rng_from_urng&) = delete;

private:
    _Udiff _Get_bits() { // return a random value within [0, _Bmask]
        for (;;) { // repeat until random value is in range
            const _Udiff _Val = static_cast<_Udiff>(_Ref() - (_Urng::min)());

            if (_Val <= _Bmask) {
                return _Val;
            }
        }
    }

    _Urng& _Ref; // reference to URNG
    size_t _Bits; // number of random bits generated by _Get_bits()
    _Udiff _Bmask; // 2^_Bits - 1
};

#if _HAS_CXX17
template <class _PopIt, class _SampleIt, class _Diff, class _RngFn>
_SampleIt _Sample_reservoir_unchecked(
    _PopIt _First, const _PopIt _Last, const _SampleIt _Dest, const _Diff _Count, _RngFn& _RngFunc) {
    // source is input: use reservoir sampling (unstable)
    // pre: _SampleIt is random-access && 0 < _Count && the range [_Dest, _Dest + _Count) is valid
    using _Diff_sample = _Iter_diff_t<_SampleIt>;
    const auto _SCount = static_cast<_Diff_sample>(_Count);
    _Iter_diff_t<_PopIt> _Pop_size{};
    for (; _Pop_size < _SCount; ++_Pop_size, (void) ++_First) {
        // _Pop_size is less than _SCount, and [_Dest, _Dest + _SCount) is valid,
        // so [_Dest, _Dest + _Pop_size) must be valid, so narrowing to _Diff_sample
        // can't overflow
        const auto _Sample_pop = static_cast<_Diff_sample>(_Pop_size);
        if (_First == _Last) {
            return _Dest + _Sample_pop;
        }

        *(_Dest + _Sample_pop) = *_First;
    }
    for (; _First != _Last; ++_First) {
        const auto _Idx = _RngFunc(++_Pop_size);
        if (_Idx < _SCount) {
            *(_Dest + static_cast<_Diff_sample>(_Idx)) = *_First; // again, valid narrowing because _Idx < _SCount
        }
    }
    return _Dest + _SCount;
}

template <class _PopIt, class _SampleIt, class _Diff, class _RngFn>
_SampleIt _Sample_selection_unchecked(
    _PopIt _First, _Iter_diff_t<_PopIt> _Pop_size, _SampleIt _Dest, _Diff _Count, _RngFn& _RngFunc) {
    // source is forward *and* we know the source range size: use selection sampling (stable)
    // pre: _PopIt is forward && _Count <= _Pop_size
    using _CT = common_type_t<_Iter_diff_t<_PopIt>, _Diff>;
    for (; _Pop_size > 0; ++_First, (void) --_Pop_size) {
        if (static_cast<_CT>(_RngFunc(_Pop_size)) < static_cast<_CT>(_Count)) {
            --_Count;
            *_Dest = *_First;
            ++_Dest;
        }
    }
    return _Dest;
}

_EXPORT_STD template <class _PopIt, class _SampleIt, class _Diff, class _Urng>
_SampleIt sample(_PopIt _First, _PopIt _Last, _SampleIt _Dest, _Diff _Count, _Urng&& _Func) {
    // randomly select _Count elements from [_First, _Last) into _Dest
    static_assert(_Is_ranges_fwd_iter_v<_PopIt> || _Is_cpp17_random_iter_v<_SampleIt>,
        "If the source range is not forward, the destination range must be a Cpp17RandomAccessIterator.");

    static_assert(is_integral_v<_Diff>, "The sample size must have an integer type.");
    _STD _Adl_verify_range(_First, _Last);
    if (0 < _Count) {
        auto _UFirst   = _STD _Get_unwrapped(_First);
        auto _ULast    = _STD _Get_unwrapped(_Last);
        using _PopDiff = _Iter_diff_t<_PopIt>;
        _Rng_from_urng<_PopDiff, remove_reference_t<_Urng>> _RngFunc(_Func);
        if constexpr (_Is_ranges_fwd_iter_v<_PopIt>) {
            // source is forward: use selection sampling (stable)
            using _CT            = common_type_t<_Diff, _PopDiff>;
            const auto _Pop_size = _STD distance(_UFirst, _ULast);
            if (static_cast<_CT>(_Count) > static_cast<_CT>(_Pop_size)) {
                _Count = static_cast<_Diff>(_Pop_size); // narrowing OK because _Count is getting smaller
            }

            _STD _Seek_wrapped(_Dest, _STD _Sample_selection_unchecked(
                                          _UFirst, _Pop_size, _STD _Get_unwrapped_n(_Dest, _Count), _Count, _RngFunc));
        } else {
            static_assert(_Is_ranges_input_iter_v<_PopIt>, "Source iterators must be at least input iterators");
            // source is input: use reservoir sampling (unstable)
            _STD _Seek_wrapped(_Dest, _STD _Sample_reservoir_unchecked(
                                          _UFirst, _ULast, _STD _Get_unwrapped_unverified(_Dest), _Count, _RngFunc));
        }
    }

    return _Dest;
}

#if _HAS_CXX20
_EXPORT_STD template <class _Ty>
concept uniform_random_bit_generator = invocable<_Ty&> && unsigned_integral<invoke_result_t<_Ty&>> && requires {
    { (_Ty::min)() } -> same_as<invoke_result_t<_Ty&>>;
    { (_Ty::max)() } -> same_as<invoke_result_t<_Ty&>>;
    requires bool_constant<(_Ty::min)() < (_Ty::max)()>::value;
};

namespace ranges {
    class _Sample_fn {
    public:
        template <input_iterator _It, sentinel_for<_It> _Se, weakly_incrementable _Out, class _Urng>
            requires (forward_iterator<_It> || random_access_iterator<_Out>)
                  && indirectly_copyable<_It, _Out> && uniform_random_bit_generator<remove_reference_t<_Urng>>
        _STATIC_CALL_OPERATOR _Out operator()(
            _It _First, _Se _Last, _Out _Output, iter_difference_t<_It> _Count, _Urng&& _Func) _CONST_CALL_OPERATOR {
            _STD _Adl_verify_range(_First, _Last);
            if (_Count <= 0) {
                return _Output;
            }

            _Rng_from_urng<iter_difference_t<_It>, remove_reference_t<_Urng>> _RngFunc(_Func);
            if constexpr (forward_iterator<_It>) {
                auto _UFirst   = _RANGES _Unwrap_iter<_Se>(_STD move(_First));
                auto _Pop_size = _RANGES distance(_UFirst, _RANGES _Unwrap_sent<_It>(_STD move(_Last)));
                return _Selection_sample(_STD move(_UFirst), _Pop_size, _STD move(_Output), _Count, _RngFunc);
            } else {
                return _Reservoir_sample(_RANGES _Unwrap_iter<_Se>(_STD move(_First)),
                    _RANGES _Unwrap_sent<_It>(_STD move(_Last)), _STD move(_Output), _Count, _RngFunc);
            }
        }

        template <input_range _Rng, weakly_incrementable _Out, class _Urng>
            requires (forward_range<_Rng> || random_access_iterator<_Out>)
                  && indirectly_copyable<iterator_t<_Rng>, _Out>
                  && uniform_random_bit_generator<remove_reference_t<_Urng>>
        _STATIC_CALL_OPERATOR _Out operator()(
            _Rng&& _Range, _Out _Output, range_difference_t<_Rng> _Count, _Urng&& _Func) _CONST_CALL_OPERATOR {
            if (_Count <= 0) {
                return _Output;
            }

            _Rng_from_urng<range_difference_t<_Rng>, remove_reference_t<_Urng>> _RngFunc(_Func);
            if constexpr (forward_range<_Rng>) {
                auto _UFirst   = _Ubegin(_Range);
                auto _Pop_size = _RANGES distance(_UFirst, _Uend(_Range));
                return _Selection_sample(_STD move(_UFirst), _Pop_size, _STD move(_Output), _Count, _RngFunc);
            } else {
                return _Reservoir_sample(_Ubegin(_Range), _Uend(_Range), _STD move(_Output), _Count, _RngFunc);
            }
        }

    private:
        template <class _It, class _Out, class _Rng>
        _NODISCARD static _Out _Selection_sample(
            _It _First, iter_difference_t<_It> _Pop_size, _Out _Output, iter_difference_t<_It> _Count, _Rng& _RngFunc) {
            // Randomly select _Count elements from _First + [0, _Pop_size) into _Output.
            // _First should be already unwrapped, _Output will be unwrapped locally.
            _STL_INTERNAL_STATIC_ASSERT(forward_iterator<_It>);
            _STL_INTERNAL_STATIC_ASSERT(weakly_incrementable<_Out>);
            _STL_INTERNAL_STATIC_ASSERT(indirectly_copyable<_It, _Out>);

            if (_Count > _Pop_size) {
                _Count = _Pop_size;
            }
            auto _UOutput = _STD _Get_unwrapped_n(_STD move(_Output), _Count);

            for (; _Pop_size > 0; ++_First, (void) --_Pop_size) {
                if (_RngFunc(_Pop_size) < _Count) {
                    *_UOutput = *_First;
                    ++_UOutput;
                    if (--_Count == 0) {
                        break;
                    }
                }
            }

            _STD _Seek_wrapped(_Output, _STD move(_UOutput));
            return _Output;
        }

        template <class _It, class _Se, class _Out, class _Rng>
        _NODISCARD static _Out _Reservoir_sample(
            _It _First, const _Se _Last, _Out _Output, const iter_difference_t<_It> _Count, _Rng& _RngFunc) {
            // Randomly select _Count elements from [_First, _Last) into _Output.
            // _First should be already unwrapped, _Output will be unwrapped locally.
            _STL_INTERNAL_STATIC_ASSERT(input_iterator<_It>);
            _STL_INTERNAL_STATIC_ASSERT(sentinel_for<_Se, _It>);
            _STL_INTERNAL_STATIC_ASSERT(random_access_iterator<_Out>);
            _STL_INTERNAL_STATIC_ASSERT(indirectly_copyable<_It, _Out>);

            auto _UOutput = _STD _Get_unwrapped_unverified(_STD move(_Output));
            iter_difference_t<_It> _Pop_size{};
            for (; _Pop_size < _Count; ++_Pop_size, (void) ++_First) {
                if (_First == _Last) {
                    _UOutput += _Pop_size;
                    _STD _Seek_wrapped(_Output, _STD move(_UOutput));
                    return _Output;
                }

                *(_UOutput + _Pop_size) = *_First;
            }
            for (; _First != _Last; ++_First) {
                const auto _Idx = _RngFunc(++_Pop_size);
                if (_Idx < _Count) {
                    *(_UOutput + _Idx) = *_First;
                }
            }

            _UOutput += _Count;
            _STD _Seek_wrapped(_Output, _STD move(_UOutput));
            return _Output;
        }
    };

    _EXPORT_STD inline constexpr _Sample_fn sample;
} // namespace ranges
#endif // _HAS_CXX20
#endif // _HAS_CXX17

template <class _RanIt, class _RngFn>
void _Random_shuffle1(_RanIt _First, _RanIt _Last, _RngFn& _RngFunc) {
    // shuffle [_First, _Last) using random function _RngFunc
    _STD _Adl_verify_range(_First, _Last);
    auto _UFirst      = _STD _Get_unwrapped(_First);
    const auto _ULast = _STD _Get_unwrapped(_Last);
    if (_UFirst == _ULast) {
        return;
    }

    using _Diff         = _Iter_diff_t<_RanIt>;
    auto _UTarget       = _UFirst;
    _Diff _Target_index = 1;
    for (; ++_UTarget != _ULast; ++_Target_index) { // randomly place an element from [_First, _Target] at _Target
        _Diff _Off = _RngFunc(static_cast<_Diff>(_Target_index + 1));
        _STL_ASSERT(0 <= _Off && _Off <= _Target_index, "random value out of range");
        if (_Off != _Target_index) { // avoid self-move-assignment
            swap(*_UTarget, *(_UFirst + _Off)); // intentional ADL
        }
    }
}

_EXPORT_STD template <class _RanIt, class _Urng>
void shuffle(_RanIt _First, _RanIt _Last, _Urng&& _Func) { // shuffle [_First, _Last) using URNG _Func
    using _Urng0 = remove_reference_t<_Urng>;
    _Rng_from_urng<_Iter_diff_t<_RanIt>, _Urng0> _RngFunc(_Func);
    _STD _Random_shuffle1(_First, _Last, _RngFunc);
}

#if _HAS_CXX20
namespace ranges {
    class _Shuffle_fn {
    public:
        template <random_access_iterator _It, sentinel_for<_It> _Se, class _Urng>
            requires permutable<_It> && uniform_random_bit_generator<remove_reference_t<_Urng>>
        _STATIC_CALL_OPERATOR _It operator()(_It _First, _Se _Last, _Urng&& _Func) _CONST_CALL_OPERATOR {
            _STD _Adl_verify_range(_First, _Last);

            _Rng_from_urng<iter_difference_t<_It>, remove_reference_t<_Urng>> _RngFunc(_Func);
            auto _UResult = _Shuffle_unchecked(
                _RANGES _Unwrap_iter<_Se>(_STD move(_First)), _RANGES _Unwrap_sent<_It>(_STD move(_Last)), _RngFunc);

            _STD _Seek_wrapped(_First, _STD move(_UResult));
            return _First;
        }

        template <random_access_range _Rng, class _Urng>
            requires permutable<iterator_t<_Rng>> && uniform_random_bit_generator<remove_reference_t<_Urng>>
        _STATIC_CALL_OPERATOR borrowed_iterator_t<_Rng> operator()(_Rng&& _Range, _Urng&& _Func) _CONST_CALL_OPERATOR {
            _Rng_from_urng<range_difference_t<_Rng>, remove_reference_t<_Urng>> _RngFunc(_Func);

            return _RANGES _Rewrap_iterator(_Range, _Shuffle_unchecked(_Ubegin(_Range), _Uend(_Range), _RngFunc));
        }

    private:
        template <class _It, class _Se, class _Rng>
        _NODISCARD static _It _Shuffle_unchecked(_It _First, const _Se _Last, _Rng& _Func) {
            // shuffle [_First, _Last) using random function _Func
            _STL_INTERNAL_STATIC_ASSERT(random_access_iterator<_It>);
            _STL_INTERNAL_STATIC_ASSERT(sentinel_for<_Se, _It>);
            _STL_INTERNAL_STATIC_ASSERT(permutable<_It>);

            if (_First == _Last) {
                return _First;
            }
            using _Diff = iter_difference_t<_It>;

            auto _Target        = _First;
            _Diff _Target_index = 1;
            for (; ++_Target != _Last; ++_Target_index) {
                // randomly place an element from [_First, _Target] at _Target
                const _Diff _Off = _Func(_Target_index + 1);
                _STL_ASSERT(0 <= _Off && _Off <= _Target_index, "random value out of range");
                if (_Off != _Target_index) { // avoid self-move-assignment
                    _RANGES iter_swap(_Target, _First + _Off);
                }
            }
            return _Target;
        }
    };

    _EXPORT_STD inline constexpr _Shuffle_fn shuffle;
} // namespace ranges
#endif // _HAS_CXX20

#if _HAS_AUTO_PTR_ETC
_EXPORT_STD template <class _RanIt, class _RngFn>
void random_shuffle(_RanIt _First, _RanIt _Last, _RngFn&& _RngFunc) {
    // shuffle [_First, _Last) using random function _RngFunc
    _STD _Random_shuffle1(_First, _Last, _RngFunc);
}

struct _Rand_urng_from_func { // wrap rand() as a URNG
    using result_type = unsigned int;

    static result_type(min)() { // return minimum possible generated value
        return 0;
    }

    static result_type(max)() { // return maximum possible generated value
        return RAND_MAX;
    }

    result_type operator()() { // invoke rand()
        return static_cast<result_type>(_CSTD rand());
    }
};

_EXPORT_STD template <class _RanIt>
void random_shuffle(_RanIt _First, _RanIt _Last) { // shuffle [_First, _Last) using rand()
    _Rand_urng_from_func _Func;
    _STD shuffle(_First, _Last, _Func);
}
#endif // _HAS_AUTO_PTR_ETC

#if _HAS_CXX20
_EXPORT_STD template <class _FwdIt>
constexpr _FwdIt shift_left(
    _FwdIt _First, const _FwdIt _Last, typename iterator_traits<_FwdIt>::difference_type _Pos_to_shift) {
    // shift [_First, _Last) left by _Pos_to_shift
    // positions; returns the end of the resulting range
    _STL_ASSERT(_Pos_to_shift >= 0, "shift count must be non-negative (N4950 [alg.shift]/1)");

    _STD _Adl_verify_range(_First, _Last);

    if (_Pos_to_shift == 0) {
        return _Last;
    }

    const auto _UFirst = _STD _Get_unwrapped(_First);
    const auto _ULast  = _STD _Get_unwrapped(_Last);
    auto _Start_at     = _UFirst;

    if constexpr (_Is_cpp17_random_iter_v<_FwdIt>) {
        if (_Pos_to_shift >= _ULast - _UFirst) {
            return _First;
        }
        _Start_at += _Pos_to_shift;
    } else {
        for (; 0 < _Pos_to_shift; --_Pos_to_shift) {
            if (_Start_at == _ULast) {
                return _First;
            }
            ++_Start_at;
        }
    }

    _STD _Seek_wrapped(_First, _STD _Move_unchecked(_Start_at, _ULast, _UFirst));
    return _First;
}

_EXPORT_STD template <class _ExPo, class _FwdIt>
    requires requires { typename _Enable_if_execution_policy_t<_ExPo>; }
_FwdIt shift_left(_ExPo&&, _FwdIt _First, _FwdIt _Last,
    typename iterator_traits<_FwdIt>::difference_type _Pos_to_shift) noexcept /* terminates */ {
    // shift [_First, _Last) left by _Pos_to_shift positions
    // not parallelized as benchmarks show it isn't worth it
    _REQUIRE_CPP17_MUTABLE_ITERATOR(_FwdIt);
    return _STD shift_left(_First, _Last, _Pos_to_shift);
}

_EXPORT_STD template <class _FwdIt>
constexpr _FwdIt shift_right(
    _FwdIt _First, const _FwdIt _Last, typename iterator_traits<_FwdIt>::difference_type _Pos_to_shift) {
    // shift [_First, _Last) right by _Pos_to_shift
    // positions; returns the beginning of the resulting range
    _STL_ASSERT(_Pos_to_shift >= 0, "shift count must be non-negative (N4950 [alg.shift]/5)");

    _STD _Adl_verify_range(_First, _Last);

    if (_Pos_to_shift == 0) {
        return _First;
    }

    const auto _UFirst = _STD _Get_unwrapped(_First);
    const auto _ULast  = _STD _Get_unwrapped(_Last);

    if constexpr (_Is_cpp17_bidi_iter_v<_FwdIt>) {
        auto _UEnd_at = _ULast;
        if constexpr (_Is_cpp17_random_iter_v<_FwdIt>) {
            if (_Pos_to_shift >= _ULast - _UFirst) {
                return _Last;
            }
            _UEnd_at -= _Pos_to_shift;
        } else {
            for (; 0 < _Pos_to_shift; --_Pos_to_shift) {
                if (_UEnd_at == _UFirst) {
                    return _Last;
                }
                --_UEnd_at;
            }
        }

        _STD _Seek_wrapped(_First, _STD _Move_backward_unchecked(_UFirst, _UEnd_at, _ULast));
        return _First;
    } else {
        auto _UResult = _UFirst;

        for (; 0 < _Pos_to_shift; --_Pos_to_shift) {
            if (_UResult == _ULast) {
                return _Last;
            }
            ++_UResult;
        }
        _STD _Seek_wrapped(_First, _UResult);

        auto _Trail = _UFirst;
        auto _Lead  = _UResult;

        for (; _Trail != _UResult; ++_Trail, (void) ++_Lead) {
            if (_Lead == _ULast) {
                _STD _Move_unchecked(_UFirst, _Trail, _UResult);

                return _First;
            }
        }

        // Here, _Trail = _UFirst + original _Pos_to_shift
        // Here, _Lead = _UFirst + 2 * original _Pos_to_shift

        for (;;) {
            // This loop swaps the range [_UFirst, _UResult) with [_Trail, _Lead),
            // advancing _Trail and _Lead by _Pos_to_shift
            for (auto _Mid = _UFirst; _Mid != _UResult; ++_Mid, (void) ++_Trail, ++_Lead) {
                if (_Lead == _ULast) {
                    _Trail = _STD _Move_unchecked(_Mid, _UResult, _Trail);
                    _STD _Move_unchecked(_UFirst, _Mid, _Trail);

                    return _First;
                }
                swap(*_Mid, *_Trail); // intentional ADL
            }
        }
    }
}

_EXPORT_STD template <class _ExPo, class _FwdIt>
    requires requires { typename _Enable_if_execution_policy_t<_ExPo>; }
_FwdIt shift_right(_ExPo&&, _FwdIt _First, _FwdIt _Last,
    typename iterator_traits<_FwdIt>::difference_type _Pos_to_shift) noexcept /* terminates */ {
    // shift [_First, _Last) right by _Pos_to_shift positions
    // not parallelized as benchmarks show it isn't worth it
    _REQUIRE_CPP17_MUTABLE_ITERATOR(_FwdIt);
    return _STD shift_right(_First, _Last, _Pos_to_shift);
}
#endif // _HAS_CXX20

#if _HAS_CXX23
namespace ranges {
    class _Shift_left_fn {
    public:
        template <permutable _It, sentinel_for<_It> _Se>
        _STATIC_CALL_OPERATOR constexpr subrange<_It> operator()(
            _It _First, const _Se _Last, iter_difference_t<_It> _Pos_to_shift) _CONST_CALL_OPERATOR {
            _STL_ASSERT(_Pos_to_shift >= 0, "shift count must be non-negative (N4950 [alg.shift]/1)");

            _STD _Adl_verify_range(_First, _Last);
            auto _Result = _First;
            _Unwrap_iter_t<_It, _Se> _UResult;

            if (_Pos_to_shift == 0) {
                _UResult = _RANGES _Get_final_iterator_unwrapped<_It>(_RANGES _Unwrap_iter<_Se>(_Result), _Last);
            } else {
                _UResult = _Shift_left_impl(
                    _RANGES _Unwrap_iter<_Se>(_First), _RANGES _Unwrap_sent<_It>(_Last), _Pos_to_shift);
            }
            _STD _Seek_wrapped(_Result, _UResult);
            return {_STD move(_First), _STD move(_Result)};
        }

        template <forward_range _Rng>
            requires permutable<iterator_t<_Rng>>
        _STATIC_CALL_OPERATOR constexpr borrowed_subrange_t<_Rng> operator()(
            _Rng&& _Range, range_difference_t<_Rng> _Pos_to_shift) _CONST_CALL_OPERATOR {
            _STL_ASSERT(_Pos_to_shift >= 0, "shift count must be non-negative (N4950 [alg.shift]/1)");

            if (_Pos_to_shift == 0) {
                auto _Last = _RANGES _Rewrap_iterator(_Range, _RANGES _Get_final_iterator_unwrapped(_Range));
                return {_RANGES begin(_Range), _STD move(_Last)};
            }

            if constexpr (sized_range<_Rng>) {
                auto _First = _RANGES begin(_Range);
                if (_RANGES distance(_Range) <= _Pos_to_shift) {
                    return {_First, _First};
                }

                auto _UFirst   = _RANGES _Unwrap_range_iter<_Rng>(_First);
                auto _Start_at = _RANGES next(_UFirst, _Pos_to_shift);
                auto _Result   = _RANGES _Move_unchecked(_STD move(_Start_at), _Uend(_Range), _UFirst).out;
                return {_STD move(_First), _RANGES _Rewrap_iterator(_Range, _STD move(_Result))};
            } else {
                auto _Result = _Shift_left_impl(_Ubegin(_Range), _Uend(_Range), _Pos_to_shift);
                return {_RANGES begin(_Range), _RANGES _Rewrap_iterator(_Range, _STD move(_Result))};
            }
        }

    private:
        template <class _It, class _Se>
        _NODISCARD static constexpr _It _Shift_left_impl(_It _First, _Se _Last, iter_d