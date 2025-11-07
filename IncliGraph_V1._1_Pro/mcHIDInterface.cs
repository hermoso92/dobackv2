using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[StandardModule]
internal sealed class mcHIDInterface
{
	public delegate int SubClassProcDelegate(int hwnd, int msg, int wParam, int lParam);

	public const int WM_APP = 32768;

	public const short GWL_WNDPROC = -4;

	private const decimal WM_HID_EVENT = 32968m;

	private const short NOTIFY_PLUGGED = 1;

	private const short NOTIFY_UNPLUGGED = 2;

	private const short NOTIFY_CHANGED = 3;

	private const short NOTIFY_READ = 4;

	private static int FPrevWinProc;

	private static int FWinHandle;

	private static SubClassProcDelegate Ref_WinProc = WinProc;

	private static object HostForm;

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "Connect", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidConnect(int pHostWin);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "Disconnect", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidDisconnect();

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetItem", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetItem(int pIndex);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetItemCount", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetItemCount();

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "Read", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidRead(int pHandle, ref byte pData);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "Write", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidWrite(int pHandle, ref byte pData);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "ReadEx", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidReadEx(int pVendorID, int pProductID, ref byte pData);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "WriteEx", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidWriteEx(int pVendorID, int pProductID, ref byte pData);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetHandle", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetHandle(int pVendoID, int pProductID);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetVendorID", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetVendorID(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetProductID", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetProductID(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetVersion", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetVersion(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetVendorName", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetVendorName(int pHandle, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pText, int pLen);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetProductName", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetProductName(int pHandle, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pText, int pLen);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetSerialNumber", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetSerialNumber(int pHandle, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pText, int pLen);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetInputReportLength", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetInputReportLength(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "GetOutputReportLength", ExactSpelling = true, SetLastError = true)]
	public static extern int hidGetOutputReportLength(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "SetReadNotify", ExactSpelling = true, SetLastError = true)]
	public static extern void hidSetReadNotify(int pHandle, bool pValue);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "IsReadNotifyEnabled", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidIsReadNotifyEnabled(int pHandle);

	[DllImport("mcHID.dll", CharSet = CharSet.Ansi, EntryPoint = "IsAvailable", ExactSpelling = true, SetLastError = true)]
	public static extern bool hidIsAvailable(int pVendorID, int pProductID);

	[DllImport("user32", CharSet = CharSet.Ansi, EntryPoint = "CallWindowProcA", ExactSpelling = true, SetLastError = true)]
	public static extern int CallWindowProc(int lpPrevWndFunc, int hwnd, int Msg, int wParam, int lParam);

	[DllImport("user32", CharSet = CharSet.Ansi, EntryPoint = "SetWindowLongA", ExactSpelling = true, SetLastError = true)]
	public static extern int SetWindowLong(int hwnd, int nIndex, int dwNewLong);

	[DllImport("USER32.DLL", CharSet = CharSet.Ansi, EntryPoint = "SetWindowLongA", ExactSpelling = true, SetLastError = true)]
	public static extern int DelegateSetWindowLong(int hwnd, int attr, SubClassProcDelegate lval);

	public static bool ConnectToHID(ref Form targetForm)
	{
		FWinHandle = targetForm.Handle.ToInt32();
		_ = 0 - (hidConnect(FWinHandle) ? 1 : 0);
		FPrevWinProc = DelegateSetWindowLong(FWinHandle, -4, Ref_WinProc);
		HostForm = targetForm;
		bool result = default(bool);
		return result;
	}

	public static bool DisconnectFromHID()
	{
		bool result = hidDisconnect();
		SetWindowLong(FWinHandle, -4, FPrevWinProc);
		return result;
	}

	private static int WinProc(int pHWnd, int pMsg, int wParam, int lParam)
	{
		if (decimal.Compare(new decimal(pMsg), 32968m) == 0)
		{
			switch (wParam)
			{
			case 1:
			{
				object hostForm2 = HostForm;
				object[] obj3 = new object[1] { lParam };
				object[] array = obj3;
				bool[] obj4 = new bool[1] { true };
				bool[] array2 = obj4;
				NewLateBinding.LateCall(hostForm2, null, "OnPlugged", obj3, null, null, obj4, IgnoreReturn: true);
				if (array2[0])
				{
					lParam = (int)Conversions.ChangeType(RuntimeHelpers.GetObjectValue(array[0]), typeof(int));
				}
				break;
			}
			case 2:
			{
				object hostForm3 = HostForm;
				object[] obj5 = new object[1] { lParam };
				object[] array = obj5;
				bool[] obj6 = new bool[1] { true };
				bool[] array2 = obj6;
				NewLateBinding.LateCall(hostForm3, null, "OnUnplugged", obj5, null, null, obj6, IgnoreReturn: true);
				if (array2[0])
				{
					lParam = (int)Conversions.ChangeType(RuntimeHelpers.GetObjectValue(array[0]), typeof(int));
				}
				break;
			}
			case 3:
				NewLateBinding.LateCall(HostForm, null, "OnChanged", new object[0], null, null, null, IgnoreReturn: true);
				break;
			case 4:
			{
				object hostForm = HostForm;
				object[] obj = new object[1] { lParam };
				object[] array = obj;
				bool[] obj2 = new bool[1] { true };
				bool[] array2 = obj2;
				NewLateBinding.LateCall(hostForm, null, "OnRead", obj, null, null, obj2, IgnoreReturn: true);
				if (array2[0])
				{
					lParam = (int)Conversions.ChangeType(RuntimeHelpers.GetObjectValue(array[0]), typeof(int));
				}
				break;
			}
			}
		}
		return CallWindowProc(FPrevWinProc, pHWnd, pMsg, wParam, lParam);
	}
}
