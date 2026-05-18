G         ulVal;        /* VT_UI4               */
                ULONGLONG     ullVal;       /* VT_UI8               */
                INT           intVal;       /* VT_INT               */
                UINT          uintVal;      /* VT_UINT              */
                DECIMAL *     pdecVal;      /* VT_BYREF|VT_DECIMAL  */
                CHAR *        pcVal;        /* VT_BYREF|VT_I1       */
                USHORT *      puiVal;       /* VT_BYREF|VT_UI2      */
                ULONG *       pulVal;       /* VT_BYREF|VT_UI4      */
                ULONGLONG *   pullVal;      /* VT_BYREF|VT_UI8      */
                INT *         pintVal;      /* VT_BYREF|VT_INT      */
                UINT *        puintVal;     /* VT_BYREF|VT_UINT     */
                struct __tagBRECORD {
                    PVOID         pvRecord;
                    IRecordInfo * pRecInfo;
                } __VARIANT_NAME_4;         /* VT_RECORD            */
            } __VARIANT_NAME_3;
        } __VARIANT_NAME_2;

        DECIMAL decVal;
    } __VARIANT_NAME_1;
};

typedef VARIANT * LPVARIANT;
typedef VARIANT VARIANTARG;
typedef VARIANT * LPVARIANTARG;

//The following typedefs are used internally by MIDL.
cpp_quote("#ifdef MIDL_PASS")
typedef const VARIANT *REFVARIANT;
cpp_quote("#else")
cpp_quote("")
cpp_quote("#ifndef _REFVARIANT_DEFINED")
cpp_quote("#define _REFVARIANT_DEFINED")
cpp_quote("#ifdef __cplusplus")
cpp_quote("#define REFVARIANT const VARIANT &")
cpp_quote("#else")
cpp_quote("#define REFVARIANT const VARIANT * __MIDL_CONST")
cpp_quote("#endif")
cpp_quote("#endif")
cpp_quote("")
cpp_quote("#endif // MIDL_PASS")
cpp_quote("")

cpp_quote("/* the following is what MIDL knows how to remote */")

struct _wireBRECORD {
    ULONG fFlags;
    ULONG clSize;
    IRecordInfo * pRecInfo;
    [size_is(clSize)] byte * pRecord;
};

struct _wireVARIANT {
    DWORD  clSize;          /* wire buffer length in units of hyper (int64) */
    DWORD  rpcReserved;     /* for future use */
    USHORT vt;
    USHORT wReserved1;
    USHORT wReserved2;
    USHORT wReserved3;
    [switch_type(ULONG), switch_is(vt)] union {
    [case(VT_I8)]       LONGLONG      llVal;        /* VT_I8                */
    [case(VT_I4)]       LONG          lVal;         /* VT_I4                */
    [case(VT_UI1)]      BYTE          bVal;         /* VT_UI1               */
    [case(VT_I2)]       SHORT         iVal;         /* VT_I2                */
    [case(VT_R4)]       FLOAT         fltVal;       /* VT_R4                */
    [case(VT_R8)]       DOUBLE        dblVal;       /* VT_R8                */
    [case(VT_BOOL)]     VARIANT_BOOL  boolVal;      /* VT_BOOL              */
    [case(VT_ERROR)]    SCODE         scode;        /* VT_ERROR             */
    [case(VT_CY)]       CY            cyVal;        /* VT_CY                */
    [case(VT_DATE)]     DATE          date;         /* VT_DATE              */
    [case(VT_BSTR)]     wireBSTR      bstrVal;      /* VT_BSTR              */
    [case(VT_UNKNOWN)]  IUnknown *    punkVal;      /* VT_UNKNOWN           */
    [case(VT_DISPATCH)] IDispatch *   pdispVal;     /* VT_DISPATCH          */
    [case(VT_ARRAY)]    wirePSAFEARRAY parray;       /* VT_ARRAY            */

    [case(VT_RECORD, VT_RECORD|VT_BYREF)]
                        wireBRECORD   brecVal;      /* VT_RECORD            */

    [case(VT_UI1|VT_BYREF)]
                        BYTE *        pbVal;        /* VT_BYREF|VT_UI1      */
    [case(VT_I2|VT_BYREF)]
                        SHORT *       piVal;        /* VT_BYREF|VT_I2       */
    [case(VT_I4|VT_BYREF)]
                        LONG *        plVal;        /* VT_BYREF|VT_I4       */
    [case(VT_I8|VT_BYREF)]
                        LONGLONG *    pllVal;       /* VT_BYREF|VT_I8       */
    [case(VT_R4|VT_BYREF)]
                        FLOAT *       pfltVal;      /* VT_BYREF|VT_R4       */
    [case(VT_R8|VT_BYREF)]
                        DOUBLE *      pdblVal;      /* VT_BYREF|VT_R8       */
    [case(VT_BOOL|VT_BYREF)]
                        VARIANT_BOOL *pboolVal;     /* VT_BYREF|VT_BOOL     */
    [case(VT_ERROR|VT_BYREF)]
                        SCODE *       pscode;       /* VT_BYREF|VT_ERROR    */
    [case(VT_CY|VT_BYREF)]
                        CY *          pcyVal;       /* VT_BYREF|VT_CY       */
    [case(VT_DATE|VT_BYREF)]
                        DATE *        pdate;        /* VT_BYREF|VT_DATE     */
    [case(VT_BSTR|VT_BYREF)]
                        wireBSTR *    pbstrVal;     /* VT_BYREF|VT_BSTR     */
    [case(VT_UNKNOWN|VT_BYREF)]
                        IUnknown **   ppunkVal;     /* VT_BYREF|VT_UNKNOWN  */
    [case(VT_DISPATCH|VT_BYREF)]
                        IDispatch **  ppdispVal;    /* VT_BYREF|VT_DISPATCH */
    [case(VT_ARRAY|VT_BYREF)]
                        wirePSAFEARRAY *pparray;     /* VT_BYREF|VT_ARRAY   */
    [case(VT_VARIANT|VT_BYREF)]
                        wireVARIANT * pvarVal;      /* VT_BYREF|VT_VARIANT  */

    [case(VT_I1)]       CHAR          cVal;         /* VT_I1                */
    [case(VT_UI2)]      USHORT        uiVal;        /* VT_UI2               */
    [case(VT_UI4)]      ULONG         ulVal;        /* VT_UI4               */
    [case(VT_UI8)]      ULONGLONG     ullVal;       /* VT_UI8               */
    [case(VT_INT)]      INT           intVal;       /* VT_INT               */
    [case(VT_UINT)]     UINT          uintVal;      /* VT_UINT              */
    [case(VT_DECIMAL)]  DECIMAL       decVal;       /* VT_DECIMAL           */

    [case(VT_BYREF|VT_DECIMAL)]
                        DECIMAL *     pdecVal;      /* VT_BYREF|VT_DECIMAL  */
    [case(VT_BYREF|VT_I1)]
                        CHAR *        pcVal;        /* VT_BYREF|VT_I1       */
    [case(VT_BYREF|VT_UI2)]
                        USHORT *      puiVal;       /* VT_BYREF|VT_UI2      */
    [case(VT_BYREF|VT_UI4)]
                        ULONG *       pulVal;       /* VT_BYREF|VT_UI4      */
    [case(VT_BYREF|VT_UI8)]
                        ULONGLONG *   pullVal;      /* VT_BYREF|VT_UI8      */
    [case(VT_BYREF|VT_INT)]
                        INT *         pintVal;      /* VT_BYREF|VT_INT      */
    [case(VT_BYREF|VT_UINT)]
                        UINT *        puintVal;     /* VT_BYREF|VT_UINT     */
    [case(VT_EMPTY)]    ;                           /* nothing              */
    [case(VT_NULL)]     ;                           /* nothing              */
    } DUMMYUNIONNAME;
};


//########################################################################
//     End of VARIANT & SAFEARRAY
//########################################################################


//TypeInfo stuff.

typedef LONG DISPID;
typedef DISPID MEMBERID;
typedef DWORD HREFTYPE;

typedef [v1_enum] enum tagTYPEKIND {
    TKIND_ENUM = 0,
    TKIND_RECORD,
    TKIND_MODULE,
    TKIND_INTERFACE,
    TKIND_DISPATCH,
    TKIND_COCLASS,
    TKIND_ALIAS,
    TKIND_UNION,
    TKIND_MAX                   /* end of enum marker */
} TYPEKIND;

typedef struct tagTYPEDESC {
    [switch_type(VARTYPE), switch_is(vt)] union {
        [case(VT_PTR, VT_SAFEARRAY)] struct tagTYPEDESC * lptdesc;
        [case(VT_CARRAY)] struct tagARRAYDESC * lpadesc;
        [case(VT_USERDEFINED)] HREFTYPE hreftype;
        [default]   ;
    } DUMMYUNIONNAME;
    VARTYPE vt;
} TYPEDESC;

typedef struct tagARRAYDESC {
    TYPEDESC tdescElem;         /* element type */
    USHORT cDims;               /* dimension count */
    [size_is(cDims)] SAFEARRAYBOUND rgbounds[]; /* var len array of bounds */
} ARRAYDESC;

// parameter description

typedef struct tagPARAMDESCEX {
    ULONG cBytes;               /* size of this structure */
    VARIANTARG varDefaultValue; /* default value of this parameter */
} PARAMDESCEX, * LPPARAMDESCEX;

typedef struct tagPARAMDESC {
    LPPARAMDESCEX pparamdescex; /* valid if PARAMFLAG_FHASDEFAULT bit is set */
    USHORT wParamFlags;         /* IN, OUT, etc */
} PARAMDESC, * LPPARAMDESC;

const USHORT PARAMFLAG_NONE         = 0x00;
const USHORT PARAMFLAG_FIN          = 0x01;
const USHORT PARAMFLAG_FOUT         = 0x02;
const USHORT PARAMFLAG_FLCID        = 0x04;
const USHORT PARAMFLAG_FRETVAL      = 0x08;
const USHORT PARAMFLAG_FOPT         = 0x10;
const USHORT PARAMFLAG_FHASDEFAULT  = 0x20;
const USHORT PARAMFLAG_FHASCUSTDATA = 0x40;

typedef struct tagIDLDESC {
    ULONG_PTR dwReserved;
    USHORT wIDLFlags;           /* IN, OUT, etc */
} IDLDESC, * LPIDLDESC;

const USHORT IDLFLAG_NONE    = PARAMFLAG_NONE;
const USHORT IDLFLAG_FIN     = PARAMFLAG_FIN;
const USHORT IDLFLAG_FOUT    = PARAMFLAG_FOUT;
const USHORT IDLFLAG_FLCID   = PARAMFLAG_FLCID;
const USHORT IDLFLAG_FRETVAL = PARAMFLAG_FRETVAL;

cpp_quote("//;begin_internal")
cpp_quote("#if 0")
cpp_quote("/* the following is what MIDL knows how to remote */")

typedef struct tagELEMDESC {    /* a format that MIDL likes */
    TYPEDESC tdesc;             /* the type of the element */
    PARAMDESC paramdesc;        /* IDLDESC is a subset of PARAMDESC */
} ELEMDESC;

cpp_quote("#else /* 0 */")
cpp_quote("//;end_internal")
cpp_quote("typedef struct tagELEMDESC {")
cpp_quote("    TYPEDESC tdesc;             /* the type of the element */")
cpp_quote("    uni