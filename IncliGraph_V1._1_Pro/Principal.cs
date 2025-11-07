using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.DatosDataSetTableAdapters;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.My.Resources;
using IncliGraph_V1._1_Pro.usersDataSetTableAdapters;
using IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;
using Microsoft.VisualBasic.FileIO;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Principal : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button3")]
	private Button _Button3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button4")]
	private Button _Button4;

	[CompilerGenerated]
	[AccessedThroughProperty("Button5")]
	private Button _Button5;

	[CompilerGenerated]
	[AccessedThroughProperty("Button6")]
	private Button _Button6;

	[CompilerGenerated]
	[AccessedThroughProperty("Button7")]
	private Button _Button7;

	[CompilerGenerated]
	[AccessedThroughProperty("ListBox1")]
	private ListBox _ListBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button8")]
	private Button _Button8;

	[CompilerGenerated]
	[AccessedThroughProperty("Button13")]
	private Button _Button13;

	[CompilerGenerated]
	[AccessedThroughProperty("MenuStrip1")]
	private MenuStrip _MenuStrip1;

	[CompilerGenerated]
	[AccessedThroughProperty("PreferenciasToolStripMenuItem")]
	private ToolStripMenuItem _PreferenciasToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("SalirToolStripMenuItem")]
	private ToolStripMenuItem _SalirToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("Button9")]
	private Button _Button9;

	[CompilerGenerated]
	[AccessedThroughProperty("Button10")]
	private Button _Button10;

	[CompilerGenerated]
	[AccessedThroughProperty("Button11")]
	private Button _Button11;

	[CompilerGenerated]
	[AccessedThroughProperty("Button12")]
	private Button _Button12;

	[CompilerGenerated]
	[AccessedThroughProperty("CambiarContraseñaToolStripMenuItem")]
	private ToolStripMenuItem _CambiarContraseñaToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("ManualDeSoftwareRequiereLectorPdfToolStripMenuItem")]
	private ToolStripMenuItem _ManualDeSoftwareRequiereLectorPdfToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("PreferenciasToolStripMenuItem1")]
	private ToolStripMenuItem _PreferenciasToolStripMenuItem1;

	[CompilerGenerated]
	[AccessedThroughProperty("CambiarContraseñaToolStripMenuItem1")]
	private ToolStripMenuItem _CambiarContraseñaToolStripMenuItem1;

	[CompilerGenerated]
	[AccessedThroughProperty("SalirToolStripMenuItem1")]
	private ToolStripMenuItem _SalirToolStripMenuItem1;

	[CompilerGenerated]
	[AccessedThroughProperty("ManualDeUsuarioToolStripMenuItem")]
	private ToolStripMenuItem _ManualDeUsuarioToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("StoragePathToolStripMenuItem")]
	private ToolStripMenuItem _StoragePathToolStripMenuItem;

	[CompilerGenerated]
	[AccessedThroughProperty("LanguageToolStripMenuItem")]
	private ToolStripMenuItem _LanguageToolStripMenuItem;

	private ResourceManager RM;

	public int vehiculo_seleccionado;

	public string ruta_raiz;

	public string ruta_nueva;

	public int vehiculo;

	public int user;

	private bool archivo_existente;

	private int num_archivos_existentes;

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button3
	{
		[CompilerGenerated]
		get
		{
			return _Button3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button3_Click;
			Button button = _Button3;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button3 = value;
			button = _Button3;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button4
	{
		[CompilerGenerated]
		get
		{
			return _Button4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button4_Click;
			Button button = _Button4;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button4 = value;
			button = _Button4;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button5
	{
		[CompilerGenerated]
		get
		{
			return _Button5;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button5_Click;
			Button button = _Button5;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button5 = value;
			button = _Button5;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox3")]
	internal virtual GroupBox GroupBox3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button6
	{
		[CompilerGenerated]
		get
		{
			return _Button6;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button6_Click;
			Button button = _Button6;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button6 = value;
			button = _Button6;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Button2")]
	internal virtual Button Button2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DatosDataSet")]
	internal virtual DatosDataSet DatosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DescargasBindingSource")]
	internal virtual BindingSource DescargasBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DescargasTableAdapter")]
	internal virtual DescargasTableAdapter DescargasTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TableAdapterManager")]
	internal virtual IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager TableAdapterManager
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button7
	{
		[CompilerGenerated]
		get
		{
			return _Button7;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button7_Click;
			Button button = _Button7;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button7 = value;
			button = _Button7;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("VehiculosDataSet")]
	internal virtual VehiculosDataSet VehiculosDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RGBindingSource")]
	internal virtual BindingSource RGBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RGTableAdapter")]
	internal virtual RGTableAdapter RGTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TableAdapterManager1")]
	internal virtual IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager TableAdapterManager1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ListBox ListBox1
	{
		[CompilerGenerated]
		get
		{
			return _ListBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ListBox1_SelectedIndexChanged;
			ListBox listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged -= value2;
			}
			_ListBox1 = value;
			listBox = _ListBox1;
			if (listBox != null)
			{
				listBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox4")]
	internal virtual TextBox TextBox4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label7")]
	internal virtual Label Label7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label8")]
	internal virtual Label Label8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button8
	{
		[CompilerGenerated]
		get
		{
			return _Button8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button8_Click;
			Button button = _Button8;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button8 = value;
			button = _Button8;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("PictureBox1")]
	internal virtual PictureBox PictureBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button13
	{
		[CompilerGenerated]
		get
		{
			return _Button13;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button13_Click;
			Button button = _Button13;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button13 = value;
			button = _Button13;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("DatosappBindingSource")]
	internal virtual BindingSource DatosappBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("DatosappTableAdapter")]
	internal virtual datosappTableAdapter DatosappTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual MenuStrip MenuStrip1
	{
		[CompilerGenerated]
		get
		{
			return _MenuStrip1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			ToolStripItemClickedEventHandler value2 = MenuStrip1_ItemClicked;
			MenuStrip menuStrip = _MenuStrip1;
			if (menuStrip != null)
			{
				menuStrip.ItemClicked -= value2;
			}
			_MenuStrip1 = value;
			menuStrip = _MenuStrip1;
			if (menuStrip != null)
			{
				menuStrip.ItemClicked += value2;
			}
		}
	}

	[field: AccessedThroughProperty("ArchivoToolStripMenuItem")]
	internal virtual ToolStripMenuItem ArchivoToolStripMenuItem
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem PreferenciasToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _PreferenciasToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = PreferenciasToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _PreferenciasToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_PreferenciasToolStripMenuItem = value;
			toolStripMenuItem = _PreferenciasToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("ToolStripMenuItem1")]
	internal virtual ToolStripSeparator ToolStripMenuItem1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem SalirToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _SalirToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = SalirToolStripMenuItem_Click_1;
			ToolStripMenuItem toolStripMenuItem = _SalirToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_SalirToolStripMenuItem = value;
			toolStripMenuItem = _SalirToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("AyudaToolStripMenuItem")]
	internal virtual ToolStripMenuItem AyudaToolStripMenuItem
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasBindingSource")]
	internal virtual BindingSource FechasBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("FechasTableAdapter")]
	internal virtual FechasTableAdapter FechasTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox11")]
	internal virtual TextBox TextBox11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox12")]
	internal virtual TextBox TextBox12
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label9")]
	internal virtual Label Label9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox13")]
	internal virtual TextBox TextBox13
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox14")]
	internal virtual TextBox TextBox14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox15")]
	internal virtual TextBox TextBox15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox16")]
	internal virtual TextBox TextBox16
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox17")]
	internal virtual TextBox TextBox17
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button9
	{
		[CompilerGenerated]
		get
		{
			return _Button9;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button9_Click;
			Button button = _Button9;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button9 = value;
			button = _Button9;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button10
	{
		[CompilerGenerated]
		get
		{
			return _Button10;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button10_Click;
			Button button = _Button10;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button10 = value;
			button = _Button10;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox18")]
	internal virtual TextBox TextBox18
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox19")]
	internal virtual TextBox TextBox19
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox20")]
	internal virtual TextBox TextBox20
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox21")]
	internal virtual TextBox TextBox21
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox22")]
	internal virtual TextBox TextBox22
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox23")]
	internal virtual TextBox TextBox23
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox24")]
	internal virtual TextBox TextBox24
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox25")]
	internal virtual TextBox TextBox25
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label10")]
	internal virtual Label Label10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button11
	{
		[CompilerGenerated]
		get
		{
			return _Button11;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button11_Click;
			Button button = _Button11;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button11 = value;
			button = _Button11;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button12
	{
		[CompilerGenerated]
		get
		{
			return _Button12;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button12_Click;
			Button button = _Button12;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button12 = value;
			button = _Button12;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox26")]
	internal virtual TextBox TextBox26
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox27")]
	internal virtual TextBox TextBox27
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox28")]
	internal virtual TextBox TextBox28
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox2")]
	internal virtual GroupBox GroupBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox10")]
	internal virtual TextBox TextBox10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox8")]
	internal virtual TextBox TextBox8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox7")]
	internal virtual TextBox TextBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox6")]
	internal virtual TextBox TextBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox5")]
	internal virtual TextBox TextBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox9")]
	internal virtual TextBox TextBox9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label12")]
	internal virtual Label Label12
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label14")]
	internal virtual Label Label14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label16")]
	internal virtual Label Label16
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label15")]
	internal virtual Label Label15
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label17")]
	internal virtual Label Label17
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label18")]
	internal virtual Label Label18
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox2")]
	internal virtual TextBox TextBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("UsersDataSet")]
	internal virtual usersDataSet UsersDataSet
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("UsersBindingSource")]
	internal virtual BindingSource UsersBindingSource
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("UsersTableAdapter")]
	internal virtual usersTableAdapter UsersTableAdapter
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TableAdapterManager2")]
	internal virtual IncliGraph_V1._1_Pro.usersDataSetTableAdapters.TableAdapterManager TableAdapterManager2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem CambiarContraseñaToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _CambiarContraseñaToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CambiarContraseñaToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _CambiarContraseñaToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_CambiarContraseñaToolStripMenuItem = value;
			toolStripMenuItem = _CambiarContraseñaToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label19")]
	internal virtual Label Label19
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem ManualDeSoftwareRequiereLectorPdfToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _ManualDeSoftwareRequiereLectorPdfToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ManualDeSoftwareRequiereLectorPdfToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _ManualDeSoftwareRequiereLectorPdfToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_ManualDeSoftwareRequiereLectorPdfToolStripMenuItem = value;
			toolStripMenuItem = _ManualDeSoftwareRequiereLectorPdfToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("ArchivoToolStripMenuItem1")]
	internal virtual ToolStripMenuItem ArchivoToolStripMenuItem1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem PreferenciasToolStripMenuItem1
	{
		[CompilerGenerated]
		get
		{
			return _PreferenciasToolStripMenuItem1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = PreferenciasToolStripMenuItem1_Click;
			ToolStripMenuItem toolStripMenuItem = _PreferenciasToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_PreferenciasToolStripMenuItem1 = value;
			toolStripMenuItem = _PreferenciasToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	internal virtual ToolStripMenuItem CambiarContraseñaToolStripMenuItem1
	{
		[CompilerGenerated]
		get
		{
			return _CambiarContraseñaToolStripMenuItem1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CambiarContraseñaToolStripMenuItem1_Click;
			ToolStripMenuItem toolStripMenuItem = _CambiarContraseñaToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_CambiarContraseñaToolStripMenuItem1 = value;
			toolStripMenuItem = _CambiarContraseñaToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	internal virtual ToolStripMenuItem SalirToolStripMenuItem1
	{
		[CompilerGenerated]
		get
		{
			return _SalirToolStripMenuItem1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = SalirToolStripMenuItem1_Click;
			ToolStripMenuItem toolStripMenuItem = _SalirToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_SalirToolStripMenuItem1 = value;
			toolStripMenuItem = _SalirToolStripMenuItem1;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("AyudaToolStripMenuItem1")]
	internal virtual ToolStripMenuItem AyudaToolStripMenuItem1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ToolStripMenuItem ManualDeUsuarioToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _ManualDeUsuarioToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ManualDeUsuarioToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _ManualDeUsuarioToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_ManualDeUsuarioToolStripMenuItem = value;
			toolStripMenuItem = _ManualDeUsuarioToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	internal virtual ToolStripMenuItem StoragePathToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _StoragePathToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = StoragePathToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _StoragePathToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_StoragePathToolStripMenuItem = value;
			toolStripMenuItem = _StoragePathToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	internal virtual ToolStripMenuItem LanguageToolStripMenuItem
	{
		[CompilerGenerated]
		get
		{
			return _LanguageToolStripMenuItem;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = LanguageToolStripMenuItem_Click;
			ToolStripMenuItem toolStripMenuItem = _LanguageToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click -= value2;
			}
			_LanguageToolStripMenuItem = value;
			toolStripMenuItem = _LanguageToolStripMenuItem;
			if (toolStripMenuItem != null)
			{
				toolStripMenuItem.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label11")]
	internal virtual Label Label11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label20")]
	internal virtual Label Label20
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Principal));
		this.Button1 = new System.Windows.Forms.Button();
		this.Button3 = new System.Windows.Forms.Button();
		this.Button4 = new System.Windows.Forms.Button();
		this.Button5 = new System.Windows.Forms.Button();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.Label14 = new System.Windows.Forms.Label();
		this.Label18 = new System.Windows.Forms.Label();
		this.Label12 = new System.Windows.Forms.Label();
		this.Button8 = new System.Windows.Forms.Button();
		this.Label2 = new System.Windows.Forms.Label();
		this.Label8 = new System.Windows.Forms.Label();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.Label20 = new System.Windows.Forms.Label();
		this.Label11 = new System.Windows.Forms.Label();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.RGBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.VehiculosDataSet = new IncliGraph_V1._1_Pro.VehiculosDataSet();
		this.Label6 = new System.Windows.Forms.Label();
		this.Label5 = new System.Windows.Forms.Label();
		this.Label4 = new System.Windows.Forms.Label();
		this.Label7 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		this.ListBox1 = new System.Windows.Forms.ListBox();
		this.Label1 = new System.Windows.Forms.Label();
		this.Button13 = new System.Windows.Forms.Button();
		this.PictureBox1 = new System.Windows.Forms.PictureBox();
		this.GroupBox3 = new System.Windows.Forms.GroupBox();
		this.Label16 = new System.Windows.Forms.Label();
		this.Label17 = new System.Windows.Forms.Label();
		this.Label15 = new System.Windows.Forms.Label();
		this.Button6 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.Button7 = new System.Windows.Forms.Button();
		this.MenuStrip1 = new System.Windows.Forms.MenuStrip();
		this.ArchivoToolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.PreferenciasToolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.StoragePathToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.LanguageToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.CambiarContraseñaToolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.SalirToolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.AyudaToolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.ManualDeUsuarioToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.ArchivoToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.PreferenciasToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.CambiarContraseñaToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.ToolStripMenuItem1 = new System.Windows.Forms.ToolStripSeparator();
		this.SalirToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.AyudaToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.ManualDeSoftwareRequiereLectorPdfToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.FechasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.DatosDataSet = new IncliGraph_V1._1_Pro.DatosDataSet();
		this.TextBox11 = new System.Windows.Forms.TextBox();
		this.TextBox12 = new System.Windows.Forms.TextBox();
		this.Label9 = new System.Windows.Forms.Label();
		this.TextBox13 = new System.Windows.Forms.TextBox();
		this.TextBox14 = new System.Windows.Forms.TextBox();
		this.TextBox15 = new System.Windows.Forms.TextBox();
		this.TextBox16 = new System.Windows.Forms.TextBox();
		this.TextBox17 = new System.Windows.Forms.TextBox();
		this.Button9 = new System.Windows.Forms.Button();
		this.Button10 = new System.Windows.Forms.Button();
		this.TextBox18 = new System.Windows.Forms.TextBox();
		this.TextBox19 = new System.Windows.Forms.TextBox();
		this.DescargasBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.TextBox20 = new System.Windows.Forms.TextBox();
		this.TextBox21 = new System.Windows.Forms.TextBox();
		this.TextBox22 = new System.Windows.Forms.TextBox();
		this.TextBox23 = new System.Windows.Forms.TextBox();
		this.TextBox24 = new System.Windows.Forms.TextBox();
		this.TextBox25 = new System.Windows.Forms.TextBox();
		this.Label10 = new System.Windows.Forms.Label();
		this.Button11 = new System.Windows.Forms.Button();
		this.Button12 = new System.Windows.Forms.Button();
		this.TextBox26 = new System.Windows.Forms.TextBox();
		this.TextBox27 = new System.Windows.Forms.TextBox();
		this.TextBox28 = new System.Windows.Forms.TextBox();
		this.TextBox10 = new System.Windows.Forms.TextBox();
		this.TextBox8 = new System.Windows.Forms.TextBox();
		this.TextBox7 = new System.Windows.Forms.TextBox();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.TextBox9 = new System.Windows.Forms.TextBox();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label19 = new System.Windows.Forms.Label();
		this.DescargasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.DescargasTableAdapter();
		this.TableAdapterManager = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager();
		this.DatosappTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.datosappTableAdapter();
		this.FechasTableAdapter = new IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.FechasTableAdapter();
		this.DatosappBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.UsersDataSet = new IncliGraph_V1._1_Pro.usersDataSet();
		this.UsersBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.UsersTableAdapter = new IncliGraph_V1._1_Pro.usersDataSetTableAdapters.usersTableAdapter();
		this.TableAdapterManager2 = new IncliGraph_V1._1_Pro.usersDataSetTableAdapters.TableAdapterManager();
		this.RGTableAdapter = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.RGTableAdapter();
		this.TableAdapterManager1 = new IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager();
		this.GroupBox1.SuspendLayout();
		this.GroupBox2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).BeginInit();
		this.GroupBox3.SuspendLayout();
		this.MenuStrip1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.DescargasBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.DatosappBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.UsersDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.UsersBindingSource).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.Button1, "Button1");
		this.Button1.BackgroundImage = IncliGraph_V1._1_Pro.My.Resources.Resources.Lateral_0;
		this.Button1.ForeColor = System.Drawing.Color.Black;
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button3, "Button3");
		this.Button3.ForeColor = System.Drawing.Color.Black;
		this.Button3.Name = "Button3";
		this.Button3.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button4, "Button4");
		this.Button4.BackgroundImage = IncliGraph_V1._1_Pro.My.Resources.Resources.Folder_Icon_2;
		this.Button4.Name = "Button4";
		this.Button4.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button5, "Button5");
		this.Button5.BackgroundImage = IncliGraph_V1._1_Pro.My.Resources.Resources.icono_graph;
		this.Button5.Name = "Button5";
		this.Button5.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.BackColor = System.Drawing.SystemColors.Control;
		this.GroupBox1.Controls.Add(this.Label14);
		this.GroupBox1.Controls.Add(this.Button1);
		this.GroupBox1.Controls.Add(this.Label18);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		resources.ApplyResources(this.Label14, "Label14");
		this.Label14.Name = "Label14";
		resources.ApplyResources(this.Label18, "Label18");
		this.Label18.Name = "Label18";
		resources.ApplyResources(this.Label12, "Label12");
		this.Label12.Name = "Label12";
		resources.ApplyResources(this.Button8, "Button8");
		this.Button8.Name = "Button8";
		this.Button8.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		resources.ApplyResources(this.Label8, "Label8");
		this.Label8.Name = "Label8";
		resources.ApplyResources(this.GroupBox2, "GroupBox2");
		this.GroupBox2.Controls.Add(this.Label20);
		this.GroupBox2.Controls.Add(this.Label11);
		this.GroupBox2.Controls.Add(this.Button3);
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.TabStop = false;
		resources.ApplyResources(this.Label20, "Label20");
		this.Label20.Name = "Label20";
		resources.ApplyResources(this.Label11, "Label11");
		this.Label11.Name = "Label11";
		resources.ApplyResources(this.TextBox4, "TextBox4");
		this.TextBox4.BackColor = System.Drawing.Color.White;
		this.TextBox4.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Id", true));
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.ReadOnly = true;
		this.RGBindingSource.DataMember = "RG";
		this.RGBindingSource.DataSource = this.VehiculosDataSet;
		this.VehiculosDataSet.DataSetName = "VehiculosDataSet";
		this.VehiculosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.Label6, "Label6");
		this.Label6.Name = "Label6";
		resources.ApplyResources(this.Label5, "Label5");
		this.Label5.Name = "Label5";
		resources.ApplyResources(this.Label4, "Label4");
		this.Label4.Name = "Label4";
		resources.ApplyResources(this.Label7, "Label7");
		this.Label7.Name = "Label7";
		resources.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		resources.ApplyResources(this.ListBox1, "ListBox1");
		this.ListBox1.FormattingEnabled = true;
		this.ListBox1.Name = "ListBox1";
		resources.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		resources.ApplyResources(this.Button13, "Button13");
		this.Button13.Name = "Button13";
		this.Button13.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.PictureBox1, "PictureBox1");
		this.PictureBox1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.PictureBox1.Image = IncliGraph_V1._1_Pro.My.Resources.Resources.cabecera_SW;
		this.PictureBox1.Name = "PictureBox1";
		this.PictureBox1.TabStop = false;
		resources.ApplyResources(this.GroupBox3, "GroupBox3");
		this.GroupBox3.BackColor = System.Drawing.SystemColors.Control;
		this.GroupBox3.Controls.Add(this.Label16);
		this.GroupBox3.Controls.Add(this.Label17);
		this.GroupBox3.Controls.Add(this.Label12);
		this.GroupBox3.Controls.Add(this.Label15);
		this.GroupBox3.Controls.Add(this.Button5);
		this.GroupBox3.Controls.Add(this.Button4);
		this.GroupBox3.Name = "GroupBox3";
		this.GroupBox3.TabStop = false;
		resources.ApplyResources(this.Label16, "Label16");
		this.Label16.Name = "Label16";
		resources.ApplyResources(this.Label17, "Label17");
		this.Label17.Name = "Label17";
		resources.ApplyResources(this.Label15, "Label15");
		this.Label15.Name = "Label15";
		resources.ApplyResources(this.Button6, "Button6");
		this.Button6.Name = "Button6";
		this.Button6.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button7, "Button7");
		this.Button7.Name = "Button7";
		this.Button7.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.MenuStrip1, "MenuStrip1");
		this.MenuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.ArchivoToolStripMenuItem1, this.AyudaToolStripMenuItem1 });
		this.MenuStrip1.Name = "MenuStrip1";
		resources.ApplyResources(this.ArchivoToolStripMenuItem1, "ArchivoToolStripMenuItem1");
		this.ArchivoToolStripMenuItem1.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.PreferenciasToolStripMenuItem1, this.CambiarContraseñaToolStripMenuItem1, this.SalirToolStripMenuItem1 });
		this.ArchivoToolStripMenuItem1.Name = "ArchivoToolStripMenuItem1";
		resources.ApplyResources(this.PreferenciasToolStripMenuItem1, "PreferenciasToolStripMenuItem1");
		this.PreferenciasToolStripMenuItem1.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.StoragePathToolStripMenuItem, this.LanguageToolStripMenuItem });
		this.PreferenciasToolStripMenuItem1.Name = "PreferenciasToolStripMenuItem1";
		resources.ApplyResources(this.StoragePathToolStripMenuItem, "StoragePathToolStripMenuItem");
		this.StoragePathToolStripMenuItem.Name = "StoragePathToolStripMenuItem";
		resources.ApplyResources(this.LanguageToolStripMenuItem, "LanguageToolStripMenuItem");
		this.LanguageToolStripMenuItem.Name = "LanguageToolStripMenuItem";
		resources.ApplyResources(this.CambiarContraseñaToolStripMenuItem1, "CambiarContraseñaToolStripMenuItem1");
		this.CambiarContraseñaToolStripMenuItem1.Name = "CambiarContraseñaToolStripMenuItem1";
		resources.ApplyResources(this.SalirToolStripMenuItem1, "SalirToolStripMenuItem1");
		this.SalirToolStripMenuItem1.Name = "SalirToolStripMenuItem1";
		resources.ApplyResources(this.AyudaToolStripMenuItem1, "AyudaToolStripMenuItem1");
		this.AyudaToolStripMenuItem1.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[1] { this.ManualDeUsuarioToolStripMenuItem });
		this.AyudaToolStripMenuItem1.Name = "AyudaToolStripMenuItem1";
		resources.ApplyResources(this.ManualDeUsuarioToolStripMenuItem, "ManualDeUsuarioToolStripMenuItem");
		this.ManualDeUsuarioToolStripMenuItem.Name = "ManualDeUsuarioToolStripMenuItem";
		resources.ApplyResources(this.ArchivoToolStripMenuItem, "ArchivoToolStripMenuItem");
		this.ArchivoToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[4] { this.PreferenciasToolStripMenuItem, this.CambiarContraseñaToolStripMenuItem, this.ToolStripMenuItem1, this.SalirToolStripMenuItem });
		this.ArchivoToolStripMenuItem.Name = "ArchivoToolStripMenuItem";
		resources.ApplyResources(this.PreferenciasToolStripMenuItem, "PreferenciasToolStripMenuItem");
		this.PreferenciasToolStripMenuItem.Name = "PreferenciasToolStripMenuItem";
		resources.ApplyResources(this.CambiarContraseñaToolStripMenuItem, "CambiarContraseñaToolStripMenuItem");
		this.CambiarContraseñaToolStripMenuItem.Name = "CambiarContraseñaToolStripMenuItem";
		resources.ApplyResources(this.ToolStripMenuItem1, "ToolStripMenuItem1");
		this.ToolStripMenuItem1.Name = "ToolStripMenuItem1";
		resources.ApplyResources(this.SalirToolStripMenuItem, "SalirToolStripMenuItem");
		this.SalirToolStripMenuItem.Name = "SalirToolStripMenuItem";
		resources.ApplyResources(this.AyudaToolStripMenuItem, "AyudaToolStripMenuItem");
		this.AyudaToolStripMenuItem.Name = "AyudaToolStripMenuItem";
		resources.ApplyResources(this.ManualDeSoftwareRequiereLectorPdfToolStripMenuItem, "ManualDeSoftwareRequiereLectorPdfToolStripMenuItem");
		this.ManualDeSoftwareRequiereLectorPdfToolStripMenuItem.Name = "ManualDeSoftwareRequiereLectorPdfToolStripMenuItem";
		resources.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Id", true));
		this.TextBox1.Name = "TextBox1";
		this.FechasBindingSource.DataMember = "Fechas";
		this.FechasBindingSource.DataSource = this.DatosDataSet;
		this.DatosDataSet.DataSetName = "DatosDataSet";
		this.DatosDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.TextBox11, "TextBox11");
		this.TextBox11.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Fecha", true));
		this.TextBox11.Name = "TextBox11";
		resources.ApplyResources(this.TextBox12, "TextBox12");
		this.TextBox12.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Hora", true));
		this.TextBox12.Name = "TextBox12";
		resources.ApplyResources(this.Label9, "Label9");
		this.Label9.Name = "Label9";
		resources.ApplyResources(this.TextBox13, "TextBox13");
		this.TextBox13.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Id_RG", true));
		this.TextBox13.Name = "TextBox13";
		resources.ApplyResources(this.TextBox14, "TextBox14");
		this.TextBox14.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Id_Disp", true));
		this.TextBox14.Name = "TextBox14";
		resources.ApplyResources(this.TextBox15, "TextBox15");
		this.TextBox15.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Datos_1", true));
		this.TextBox15.Name = "TextBox15";
		resources.ApplyResources(this.TextBox16, "TextBox16");
		this.TextBox16.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Datos_2", true));
		this.TextBox16.Name = "TextBox16";
		resources.ApplyResources(this.TextBox17, "TextBox17");
		this.TextBox17.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.FechasBindingSource, "Registro", true));
		this.TextBox17.Name = "TextBox17";
		resources.ApplyResources(this.Button9, "Button9");
		this.Button9.Name = "Button9";
		this.Button9.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button10, "Button10");
		this.Button10.Name = "Button10";
		this.Button10.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.TextBox18, "TextBox18");
		this.TextBox18.Name = "TextBox18";
		resources.ApplyResources(this.TextBox19, "TextBox19");
		this.TextBox19.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Id_descarga", true));
		this.TextBox19.Name = "TextBox19";
		this.DescargasBindingSource.DataMember = "Descargas";
		this.DescargasBindingSource.DataSource = this.DatosDataSet;
		resources.ApplyResources(this.TextBox20, "TextBox20");
		this.TextBox20.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Id_RG", true));
		this.TextBox20.Name = "TextBox20";
		resources.ApplyResources(this.TextBox21, "TextBox21");
		this.TextBox21.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Id_disp", true));
		this.TextBox21.Name = "TextBox21";
		resources.ApplyResources(this.TextBox22, "TextBox22");
		this.TextBox22.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Ruta_folder", true));
		this.TextBox22.Name = "TextBox22";
		resources.ApplyResources(this.TextBox23, "TextBox23");
		this.TextBox23.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Config1", true));
		this.TextBox23.Name = "TextBox23";
		resources.ApplyResources(this.TextBox24, "TextBox24");
		this.TextBox24.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Config2", true));
		this.TextBox24.Name = "TextBox24";
		resources.ApplyResources(this.TextBox25, "TextBox25");
		this.TextBox25.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Fecha", true));
		this.TextBox25.Name = "TextBox25";
		resources.ApplyResources(this.Label10, "Label10");
		this.Label10.Name = "Label10";
		resources.ApplyResources(this.Button11, "Button11");
		this.Button11.Name = "Button11";
		this.Button11.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button12, "Button12");
		this.Button12.Name = "Button12";
		this.Button12.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.TextBox26, "TextBox26");
		this.TextBox26.Name = "TextBox26";
		resources.ApplyResources(this.TextBox27, "TextBox27");
		this.TextBox27.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.DescargasBindingSource, "Hora", true));
		this.TextBox27.Name = "TextBox27";
		resources.ApplyResources(this.TextBox28, "TextBox28");
		this.TextBox28.Name = "TextBox28";
		resources.ApplyResources(this.TextBox10, "TextBox10");
		this.TextBox10.BackColor = System.Drawing.Color.White;
		this.TextBox10.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Id_Dispositivo", true));
		this.TextBox10.Name = "TextBox10";
		this.TextBox10.ReadOnly = true;
		resources.ApplyResources(this.TextBox8, "TextBox8");
		this.TextBox8.BackColor = System.Drawing.Color.White;
		this.TextBox8.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Config_2", true));
		this.TextBox8.Name = "TextBox8";
		this.TextBox8.ReadOnly = true;
		resources.ApplyResources(this.TextBox7, "TextBox7");
		this.TextBox7.BackColor = System.Drawing.Color.White;
		this.TextBox7.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Config_1", true));
		this.TextBox7.Name = "TextBox7";
		this.TextBox7.ReadOnly = true;
		resources.ApplyResources(this.TextBox6, "TextBox6");
		this.TextBox6.BackColor = System.Drawing.Color.White;
		this.TextBox6.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Matricula", true));
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		resources.ApplyResources(this.TextBox5, "TextBox5");
		this.TextBox5.BackColor = System.Drawing.Color.White;
		this.TextBox5.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Num_Identificacion", true));
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.ReadOnly = true;
		resources.ApplyResources(this.TextBox9, "TextBox9");
		this.TextBox9.BackColor = System.Drawing.Color.White;
		this.TextBox9.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.RGBindingSource, "Fecha_Carga", true));
		this.TextBox9.Name = "TextBox9";
		this.TextBox9.ReadOnly = true;
		resources.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.Name = "TextBox2";
		resources.ApplyResources(this.Label19, "Label19");
		this.Label19.Name = "Label19";
		this.DescargasTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager.datosappTableAdapter = this.DatosappTableAdapter;
		this.TableAdapterManager.DescargasTableAdapter = this.DescargasTableAdapter;
		this.TableAdapterManager.FechasTableAdapter = this.FechasTableAdapter;
		this.TableAdapterManager.UpdateOrder = IncliGraph_V1._1_Pro.DatosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		this.DatosappTableAdapter.ClearBeforeFill = true;
		this.FechasTableAdapter.ClearBeforeFill = true;
		this.DatosappBindingSource.DataMember = "datosapp";
		this.DatosappBindingSource.DataSource = this.DatosDataSet;
		this.UsersDataSet.DataSetName = "usersDataSet";
		this.UsersDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.UsersBindingSource.DataMember = "users";
		this.UsersBindingSource.DataSource = this.UsersDataSet;
		this.UsersTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager2.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager2.UpdateOrder = IncliGraph_V1._1_Pro.usersDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		this.TableAdapterManager2.usersTableAdapter = this.UsersTableAdapter;
		this.RGTableAdapter.ClearBeforeFill = true;
		this.TableAdapterManager1.BackupDataSetBeforeUpdate = false;
		this.TableAdapterManager1.RGTableAdapter = this.RGTableAdapter;
		this.TableAdapterManager1.UpdateOrder = IncliGraph_V1._1_Pro.VehiculosDataSetTableAdapters.TableAdapterManager.UpdateOrderOption.InsertUpdateDelete;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		this.BackColor = System.Drawing.SystemColors.Control;
		base.Controls.Add(this.Label19);
		base.Controls.Add(this.TextBox2);
		base.Controls.Add(this.Button8);
		base.Controls.Add(this.TextBox28);
		base.Controls.Add(this.ListBox1);
		base.Controls.Add(this.TextBox9);
		base.Controls.Add(this.Button13);
		base.Controls.Add(this.Label1);
		base.Controls.Add(this.Button12);
		base.Controls.Add(this.Label2);
		base.Controls.Add(this.Button10);
		base.Controls.Add(this.Label8);
		base.Controls.Add(this.Button11);
		base.Controls.Add(this.Button9);
		base.Controls.Add(this.TextBox4);
		base.Controls.Add(this.Label10);
		base.Controls.Add(this.Label6);
		base.Controls.Add(this.Label9);
		base.Controls.Add(this.TextBox5);
		base.Controls.Add(this.TextBox25);
		base.Controls.Add(this.Label5);
		base.Controls.Add(this.TextBox17);
		base.Controls.Add(this.TextBox6);
		base.Controls.Add(this.TextBox24);
		base.Controls.Add(this.Label4);
		base.Controls.Add(this.TextBox16);
		base.Controls.Add(this.TextBox7);
		base.Controls.Add(this.TextBox23);
		base.Controls.Add(this.Label7);
		base.Controls.Add(this.TextBox8);
		base.Controls.Add(this.TextBox15);
		base.Controls.Add(this.Label3);
		base.Controls.Add(this.TextBox22);
		base.Controls.Add(this.TextBox10);
		base.Controls.Add(this.TextBox14);
		base.Controls.Add(this.TextBox21);
		base.Controls.Add(this.TextBox13);
		base.Controls.Add(this.TextBox20);
		base.Controls.Add(this.TextBox12);
		base.Controls.Add(this.TextBox19);
		base.Controls.Add(this.TextBox26);
		base.Controls.Add(this.TextBox18);
		base.Controls.Add(this.TextBox11);
		base.Controls.Add(this.TextBox27);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.Button7);
		base.Controls.Add(this.PictureBox1);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button6);
		base.Controls.Add(this.GroupBox3);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.MenuStrip1);
		base.Controls.Add(this.GroupBox2);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MainMenuStrip = this.MenuStrip1;
		base.MaximizeBox = false;
		base.Name = "Principal";
		base.ShowIcon = false;
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.RGBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.VehiculosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).EndInit();
		this.GroupBox3.ResumeLayout(false);
		this.GroupBox3.PerformLayout();
		this.MenuStrip1.ResumeLayout(false);
		this.MenuStrip1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.FechasBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.DatosDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.DescargasBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.DatosappBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.UsersDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.UsersBindingSource).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Principal_BindingContextChanged(object sender, EventArgs e)
	{
	}

	[DllImport("Shell32.Dll", CharSet = CharSet.Ansi, EntryPoint = "ShellExecuteA", ExactSpelling = true, SetLastError = true)]
	private static extern long ShellExecute(long hWnd, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pOperation, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pFile, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pParameters, [MarshalAs(UnmanagedType.VBByRefStr)] ref string pdirectory, long nShowCmd);

	private void Button6_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Base_Datos_Vehiculos.Show();
		base.Visible = false;
	}

	private void Button5_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Form1.Show();
		base.Visible = false;
	}

	private void Button3_Click(object sender, EventArgs e)
	{
		if ((user == 0) | (user == 1))
		{
			MyProject.Forms.Carga_Datos.Show();
			base.Visible = false;
		}
		else
		{
			MyProject.Forms.contra_avanzada.Show();
		}
	}

	public void Guardar_ruta()
	{
		DatosDataSet.datosapp[DatosappBindingSource.Position].ruta = ruta_nueva;
		Directory.Move(ruta_raiz + "\\VEXT-IS1", ruta_nueva + "\\VEXT-IS1");
		ruta_raiz = ruta_nueva;
		TextBox28.Text = ruta_raiz;
		Validate();
		DatosappBindingSource.EndEdit();
		DatosappTableAdapter.Update(DatosDataSet.datosapp);
		DatosappBindingSource.Position = 0;
	}

	private void Principal_EnabledChanged(object sender, EventArgs e)
	{
		TextBox2.Text = Conversions.ToString(user);
		if (user == 0)
		{
			Button3.Text = "";
			Button1.Text = "";
			Label19.Text = "Usuario: UCO";
		}
		else if (user == 1)
		{
			Button3.Text = "";
			Button1.Text = "";
			Label19.Text = RM.GetString("useradmin");
		}
		else
		{
			Button3.Text = RM.GetString("accesolimitado");
			Button3.ForeColor = Color.Black;
			Label19.Text = RM.GetString("userinstructor");
		}
	}

	private void Principal_Load(object sender, EventArgs e)
	{
		Button1.Image = Image.FromFile(Application.StartupPath + "\\Resources\\lateral_0.jpg");
		Label11.Text = frases.ResourceManager.GetString("cargadatosinclisafe");
		UsersTableAdapter.Fill(UsersDataSet.users);
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		checked
		{
			FechasBindingSource.Position = FechasBindingSource.Count - 1;
			DatosappTableAdapter.Fill(DatosDataSet.datosapp);
			RGTableAdapter.Fill(VehiculosDataSet.RG);
			RGBindingSource.Position = 0;
			DescargasTableAdapter.Fill(DatosDataSet.Descargas);
			DescargasBindingSource.Position = DescargasBindingSource.Count - 1;
			actualizar_botones();
			actualizar_lista();
			Actualizar_Casillas();
			if (DatosappBindingSource.Count == 0)
			{
				DatosDataSet.datosappDataTable datosapp = DatosDataSet.datosapp;
				DataRowCollection rows = datosapp.Rows;
				DataRow dataRow = datosapp.NewRow();
				dataRow[0] = 1;
				dataRow[1] = "C:";
				rows.Add(dataRow);
				Validate();
				DatosappBindingSource.EndEdit();
				DatosappTableAdapter.Update(DatosDataSet.datosapp);
				DatosappBindingSource.Position = 0;
			}
			else
			{
				DatosappBindingSource.Position = 0;
			}
			if (UsersBindingSource.Count == 0)
			{
				DataTable users = UsersDataSet.users;
				DataRowCollection rows2 = users.Rows;
				int num = 1;
				do
				{
					DataRow dataRow2 = users.NewRow();
					dataRow2[0] = num;
					switch (num)
					{
					case 1:
						dataRow2[1] = "0";
						dataRow2[2] = "admin";
						break;
					case 2:
						dataRow2[1] = "1";
						dataRow2[2] = "uco";
						break;
					default:
						dataRow2[1] = "2";
						dataRow2[2] = "instructor";
						break;
					}
					rows2.Add(dataRow2);
					num++;
				}
				while (num <= 3);
				Validate();
				UsersBindingSource.EndEdit();
				UsersTableAdapter.Update(UsersDataSet.users);
				UsersBindingSource.Position = 0;
			}
			else
			{
				UsersBindingSource.Position = 0;
			}
			ruta_raiz = DatosDataSet.datosapp[DatosappBindingSource.Position].ruta;
			TextBox28.Text = ruta_raiz;
			base.Enabled = false;
			MyProject.Forms.Usuarios.Show();
		}
	}

	private void actualizar_botones()
	{
		if (RGBindingSource.Count == 0)
		{
			Button3.Enabled = false;
			Button5.Enabled = false;
		}
		else
		{
			Button3.Enabled = true;
			Button5.Enabled = true;
		}
	}

	private void actualizar_lista()
	{
		int count = RGBindingSource.Count;
		if (count == 0)
		{
			ListBox1.Items.Clear();
			return;
		}
		ListBox1.Items.Clear();
		checked
		{
			int num = count - 1;
			for (int i = 0; i <= num; i++)
			{
				RGBindingSource.Position = i;
				ListBox1.Items.Add(VehiculosDataSet.RG[RGBindingSource.Position].Matricula);
				ListBox1.SelectedIndex = 0;
			}
		}
	}

	private void Actualizar_Casillas()
	{
		RGBindingSource.Position = ListBox1.SelectedIndex;
	}

	private void Button4_Click(object sender, EventArgs e)
	{
		Modificar_Archivos();
	}

	private void Extraer_Datos()
	{
		_ = Environment.NewLine;
		FolderBrowserDialog folderBrowserDialog = new FolderBrowserDialog();
		folderBrowserDialog.RootFolder = Environment.SpecialFolder.Desktop;
		folderBrowserDialog.ShowNewFolderButton = false;
		folderBrowserDialog.Description = RM.GetString("seleccionecapeta");
		if (folderBrowserDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		MyProject.Forms.barra.Show();
		MyProject.Forms.barra.Refresh();
		string selectedPath = folderBrowserDialog.SelectedPath;
		string text = "";
		int num = 0;
		string text2 = "";
		int num2 = 0;
		string text3 = "";
		string text4 = "";
		string path = "";
		string text5 = "";
		int num3 = 0;
		string text6 = "";
		checked
		{
			int num6 = default(int);
			int num7 = default(int);
			int num8 = default(int);
			while (num2 == 0)
			{
				num++;
				text2 = Conversions.ToString(num);
				if (text2.Length == 1)
				{
					text2 = "000" + text2;
				}
				else if (text2.Length == 2)
				{
					text2 = "00" + text2;
				}
				else if (text2.Length == 3)
				{
					text2 = "0" + text2;
				}
				text2 += ".csv";
				text = selectedPath + "\\" + text2;
				if (MyProject.Computer.FileSystem.FileExists(text))
				{
					using TextFieldParser textFieldParser = new TextFieldParser(text);
					textFieldParser.TextFieldType = FieldType.Delimited;
					textFieldParser.SetDelimiters(";");
					int num4 = 0;
					int num5 = 0;
					while (!textFieldParser.EndOfData)
					{
						string[] array = textFieldParser.ReadFields();
						if (array.Length == 4)
						{
							text3 = ruta_raiz + "\\VEXT-IS1\\Vehiculo_RG_" + array[1] + "-Dispositivo_" + array[0];
							text6 = array[0];
							num3 = Conversions.ToInteger(array[1]);
							if (!MyProject.Computer.FileSystem.DirectoryExists(text3))
							{
								Directory.CreateDirectory(text3);
							}
							text4 = ruta_raiz + "\\VEXT-IS1\\Vehiculo_RG_" + array[1] + "-Dispositivo_" + array[0] + "\\" + array[2];
							if (!MyProject.Computer.FileSystem.DirectoryExists(text4))
							{
								Directory.CreateDirectory(text4);
							}
							string[] array2 = Strings.Split(array[3], ":", -1, CompareMethod.Text);
							num6 = Conversions.ToInteger(array2[0]);
							num7 = Conversions.ToInteger(array2[1]);
							num8 = Conversions.ToInteger(array2[2]);
							string text7 = "Hora inicio " + array2[0] + "." + array2[1] + "." + array2[2];
							path = text4 + "\\" + text7 + ".csv";
							File.Create(path).Close();
							DatosDataSet.DescargasDataTable descargas = DatosDataSet.Descargas;
							DataRowCollection rows = descargas.Rows;
							DataRow dataRow = descargas.NewRow();
							DescargasBindingSource.Position = DescargasBindingSource.Count - 1;
							if (DescargasBindingSource.Count == 0)
							{
								dataRow[0] = 1;
							}
							else
							{
								dataRow[0] = Conversions.ToDouble(DatosDataSet.Descargas[DescargasBindingSource.Position].Id_descarga) + 1.0;
							}
							dataRow[2] = num3;
							dataRow[1] = text6;
							dataRow[3] = text3;
							dataRow[4] = "Combate";
							dataRow[5] = "Combate";
							dataRow[6] = array[2];
							dataRow[7] = array2[0] + ":" + array2[1] + ":" + array2[2];
							rows.Add(dataRow);
							DescargasBindingSource.EndEdit();
							DescargasTableAdapter.Update(DatosDataSet.Descargas);
							num4 = 0;
							continue;
						}
						if (array.Length == 1)
						{
							string[] array3 = Strings.Split(array[0], ":", -1, CompareMethod.Text);
							num6 = Conversions.ToInteger(array3[0]);
							num7 = Conversions.ToInteger(array3[1]);
							num8 = Conversions.ToInteger(array3[2]);
							num5 = 0;
							continue;
						}
						num4++;
						num5++;
						text5 = "";
						text5 += Conversions.ToString(num4);
						int result = 0;
						Math.DivRem(num5, 10, out result);
						if (result == 0)
						{
							num8++;
							if (num8 > 59)
							{
								num7++;
								num8 = 0;
								if (num7 > 59)
								{
									num6++;
									num7 = 0;
									if (num6 > 23)
									{
										num6 = 0;
									}
								}
							}
						}
						string text8 = ((num6 >= 10) ? Conversions.ToString(num6) : ("0" + Conversions.ToString(num6)));
						string text9 = ((num7 >= 10) ? Conversions.ToString(num7) : ("0" + Conversions.ToString(num7)));
						string text10 = ((num8 >= 10) ? Conversions.ToString(num8) : ("0" + Conversions.ToString(num8)));
						text5 = text5 + ";" + text8 + ":" + text9 + ":" + text10 + ";";
						int num9 = 0;
						do
						{
							text5 = text5 + array[num9] + ";";
							num9++;
						}
						while (num9 <= 18);
						float num10 = (float)(Math.Atan(String_a_Numero(array[4]) / String_a_Numero(array[6])) * 180.0 / Math.PI);
						float num11 = (float)(Math.Atan(String_a_Numero(array[5]) / String_a_Numero(array[6])) * 180.0 / Math.PI);
						num10 = (float)(Math.Round(100f * num10) / 100.0);
						num11 = (float)(Math.Round(100f * num11) / 100.0);
						text5 = text5 + Numero_a_String(num10) + ";";
						text5 += Numero_a_String(num11);
						using StreamWriter streamWriter = new StreamWriter(path, append: true);
						streamWriter.WriteLine(text5);
						streamWriter.Close();
					}
				}
				else
				{
					num2 = 1;
				}
			}
			MyProject.Forms.barra.Close();
			Interaction.MsgBox(RM.GetString("finproceso") + " " + Conversions.ToString(num - 1) + " " + RM.GetString("archivos"));
		}
	}

	private void Modificar_Archivos()
	{
		num_archivos_existentes = 0;
		string newLine = Environment.NewLine;
		FolderBrowserDialog folderBrowserDialog = new FolderBrowserDialog();
		folderBrowserDialog.RootFolder = Environment.SpecialFolder.Desktop;
		folderBrowserDialog.ShowNewFolderButton = false;
		folderBrowserDialog.Description = RM.GetString("seleccionecapeta");
		if (folderBrowserDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		MyProject.Forms.barra.Show();
		MyProject.Forms.barra.Refresh();
		string selectedPath = folderBrowserDialog.SelectedPath;
		string text = "";
		int num = 0;
		string text2 = "";
		int num2 = 0;
		string text3 = "";
		string text4 = "";
		string text5 = "";
		string text6 = "";
		string text7 = "";
		checked
		{
			while (num2 == 0)
			{
				num++;
				text2 = Conversions.ToString(num);
				if (text2.Length == 1)
				{
					text2 = "000" + text2;
				}
				else if (text2.Length == 2)
				{
					text2 = "00" + text2;
				}
				else if (text2.Length == 3)
				{
					text2 = "0" + text2;
				}
				text2 += ".csv";
				text = selectedPath + "\\" + text2;
				if (MyProject.Computer.FileSystem.FileExists(text))
				{
					using TextFieldParser textFieldParser = new TextFieldParser(text);
					textFieldParser.TextFieldType = FieldType.Delimited;
					textFieldParser.SetDelimiters(";");
					if (textFieldParser.EndOfData)
					{
						continue;
					}
					string[] array = textFieldParser.ReadFields();
					if (array.Length != 18)
					{
						continue;
					}
					text6 = array[1].TrimEnd('*');
					text3 = ruta_raiz + "\\VEXT-IS1\\VEXT-IS1-" + text6;
					text7 = array[0];
					if (!MyProject.Computer.FileSystem.DirectoryExists(text3))
					{
						Directory.CreateDirectory(text3);
					}
					string[] array2 = Strings.Split(array[2], "-", -1, CompareMethod.Text);
					string text8 = array2[0];
					if (text8.Length == 1)
					{
						text8 = "0" + text8;
					}
					string text9 = array2[1];
					if (text9.Length == 1)
					{
						text9 = "0" + text9;
					}
					string text10 = array2[2];
					text4 = text3 + "\\" + text10;
					if (!MyProject.Computer.FileSystem.DirectoryExists(text4))
					{
						Directory.CreateDirectory(text4);
					}
					string[] array3 = Strings.Split(array[3], ":", -1, CompareMethod.Text);
					Conversions.ToInteger(array3[0]);
					Conversions.ToInteger(array3[1]);
					Conversions.ToInteger(array3[2]);
					string text11 = array[1].TrimEnd('*') + " - " + text8 + "-" + text9 + "-" + text10;
					text5 = text4 + "\\" + text11 + ".csv";
					if (File.Exists(text5))
					{
						int num3 = (int)new FileInfo(text5).Length;
						int num4 = (int)new FileInfo(text).Length;
						if (num3 == num4)
						{
							archivo_existente = true;
							num_archivos_existentes++;
							continue;
						}
						File.Copy(text, text5, overwrite: true);
						DatosDataSet.DescargasDataTable descargas = DatosDataSet.Descargas;
						DataRowCollection rows = descargas.Rows;
						DataRow dataRow = descargas.NewRow();
						DescargasBindingSource.Position = DescargasBindingSource.Count - 1;
						if (DescargasBindingSource.Count == 0)
						{
							dataRow[0] = 1;
						}
						else
						{
							dataRow[0] = Conversions.ToDouble(DatosDataSet.Descargas[DescargasBindingSource.Position].Id_descarga) + 1.0;
						}
						dataRow[1] = text6;
						dataRow[2] = text7;
						dataRow[3] = text3;
						if (Operators.CompareString(array[6], "2.604", TextCompare: false) == 0)
						{
							dataRow[4] = "Sin Carga";
						}
						else
						{
							dataRow[4] = "Con Carga";
						}
						if (Operators.CompareString(array[9], "2.604", TextCompare: false) == 0)
						{
							dataRow[5] = "Sin Carga";
						}
						else
						{
							dataRow[5] = "Con Carga";
						}
						dataRow[6] = array[2];
						dataRow[7] = array3[0] + ":" + array3[1] + ":" + array3[2];
						rows.Add(dataRow);
						DescargasBindingSource.EndEdit();
						DescargasTableAdapter.Update(DatosDataSet.Descargas);
					}
					else
					{
						File.Copy(text, text5);
						DatosDataSet.DescargasDataTable descargas2 = DatosDataSet.Descargas;
						DataRowCollection rows2 = descargas2.Rows;
						DataRow dataRow2 = descargas2.NewRow();
						DescargasBindingSource.Position = DescargasBindingSource.Count - 1;
						if (DescargasBindingSource.Count == 0)
						{
							dataRow2[0] = 1;
						}
						else
						{
							dataRow2[0] = Conversions.ToDouble(DatosDataSet.Descargas[DescargasBindingSource.Position].Id_descarga) + 1.0;
						}
						dataRow2[1] = text6;
						dataRow2[2] = text7;
						dataRow2[3] = text3;
						if (Operators.CompareString(array[6], "2.604", TextCompare: false) == 0)
						{
							dataRow2[4] = "Sin Carga";
						}
						else
						{
							dataRow2[4] = "Con Carga";
						}
						if (Operators.CompareString(array[9], "2.604", TextCompare: false) == 0)
						{
							dataRow2[5] = "Sin Carga";
						}
						else
						{
							dataRow2[5] = "Con Carga";
						}
						dataRow2[6] = array[2];
						dataRow2[7] = array3[0] + ":" + array3[1] + ":" + array3[2];
						rows2.Add(dataRow2);
						DescargasBindingSource.EndEdit();
						DescargasTableAdapter.Update(DatosDataSet.Descargas);
					}
				}
				else
				{
					num2 = 1;
				}
			}
			MyProject.Forms.barra.Close();
			RM.GetString("finproceso");
			if (num_archivos_existentes > 0)
			{
				Interaction.MsgBox(RM.GetString("finproceso") + " " + RM.GetString("archivos") + "  " + RM.GetString("de") + "  " + Conversions.ToString(num - 1) + " " + RM.GetString("dias") + newLine + Conversions.ToString(num_archivos_existentes) + " " + RM.GetString("registrados"));
			}
			else
			{
				Interaction.MsgBox(RM.GetString("finproceso") + " " + RM.GetString("archivos") + "  " + RM.GetString("de") + "  " + Conversions.ToString(num - 1) + " " + RM.GetString("dias"));
			}
		}
	}

	private float String_a_Numero(string cadena)
	{
		checked
		{
			int num = cadena.Length - 1;
			string text = "";
			int num2 = num;
			for (int i = 0; i <= num2; i++)
			{
				text = ((Operators.CompareString(Conversions.ToString(cadena[i]), ".", TextCompare: false) != 0) ? (text + Conversions.ToString(cadena[i])) : (text + ","));
			}
			return Conversions.ToSingle(text);
		}
	}

	private string Numero_a_String(float cadena)
	{
		string text = Conversions.ToString(cadena);
		checked
		{
			int num = text.Length - 1;
			string text2 = "";
			int num2 = num;
			for (int i = 0; i <= num2; i++)
			{
				text2 = ((Operators.CompareString(Conversions.ToString(text[i]), ",", TextCompare: false) != 0) ? (text2 + Conversions.ToString(text[i])) : (text2 + "."));
			}
			return text2;
		}
	}

	private void Button7_Click(object sender, EventArgs e)
	{
		checked
		{
			int num = DescargasBindingSource.Count - 1;
			for (int i = 0; i <= num; i++)
			{
				if (DescargasBindingSource.Count != 0)
				{
					NewLateBinding.LateCall(NewLateBinding.LateGet(DescargasBindingSource.Current, null, "row", new object[0], null, null, null), null, "delete", new object[0], null, null, null, IgnoreReturn: true);
					Validate();
					DescargasBindingSource.EndEdit();
					DescargasTableAdapter.Update(DatosDataSet.Descargas);
				}
			}
			DescargasTableAdapter.Fill(DatosDataSet.Descargas);
		}
	}

	private void Principal_VisibleChanged(object sender, EventArgs e)
	{
		RGTableAdapter.Fill(VehiculosDataSet.RG);
		RGBindingSource.Position = 0;
		FechasTableAdapter.Fill(DatosDataSet.Fechas);
		FechasBindingSource.Position = 0;
		DescargasTableAdapter.Fill(DatosDataSet.Descargas);
		DescargasBindingSource.Position = 0;
		actualizar_botones();
		actualizar_lista();
		Actualizar_Casillas();
	}

	private void ListBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		vehiculo_seleccionado = ListBox1.SelectedIndex;
		Actualizar_Casillas();
	}

	private void Button8_Click(object sender, EventArgs e)
	{
		if (ListBox1.SelectedIndex < 0)
		{
			Interaction.MsgBox("Por favor, seleccione un vehículo de la lista");
			return;
		}
		vehiculo = Conversions.ToInteger(VehiculosDataSet.RG[ListBox1.SelectedIndex].Matricula);
		MyProject.Forms.Historial_Cargas.Show();
		base.Visible = false;
	}

	private void Button13_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Preferencias.Show();
	}

	private void PreferenciasToolStripMenuItem_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Preferencias.Show();
	}

	private void SalirToolStripMenuItem_Click_1(object sender, EventArgs e)
	{
		Close();
	}

	private void Button10_Click(object sender, EventArgs e)
	{
		checked
		{
			FechasBindingSource.Position++;
		}
	}

	private void Button9_Click(object sender, EventArgs e)
	{
		checked
		{
			FechasBindingSource.Position--;
		}
	}

	private void Button12_Click(object sender, EventArgs e)
	{
		checked
		{
			DescargasBindingSource.Position++;
		}
	}

	private void Button11_Click(object sender, EventArgs e)
	{
		checked
		{
			DescargasBindingSource.Position--;
		}
	}

	private void CambiarContraseñaToolStripMenuItem_Click(object sender, EventArgs e)
	{
		MyProject.Forms.cambiarcontra.Show();
	}

	private void ManualDeUsoEInstalaciónRequiereLectorPdfToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string startupPath = Application.StartupPath;
		try
		{
			Interaction.Shell("rundll32.exe url.dll,FileProtocolHandler " + startupPath + "\\Resources\\Manual - Software Full VEXT V1.pdf");
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			string newLine = Environment.NewLine;
			Interaction.MsgBox(RM.GetString("problema") + newLine + RM.GetString("acuda"));
			ProjectData.ClearProjectError();
		}
	}

	private void ManualDeSoftwareRequiereLectorPdfToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string startupPath = Application.StartupPath;
		try
		{
			Interaction.Shell("rundll32.exe url.dll,FileProtocolHandler " + startupPath + "\\Resources\\Manual-Software-VEXT-V1.pdf");
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			string newLine = Environment.NewLine;
			Interaction.MsgBox(RM.GetString("problema") + newLine + RM.GetString("acuda"));
			ProjectData.ClearProjectError();
		}
	}

	private void FichaDeInstalaciónRequiereLectorPdfToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string startupPath = Application.StartupPath;
		try
		{
			Interaction.Shell("rundll32.exe url.dll,FileProtocolHandler " + startupPath + "\\Resources\\Ficha_Montaje.pdf");
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			string newLine = Environment.NewLine;
			Interaction.MsgBox(RM.GetString("problema") + newLine + RM.GetString("acuda"));
			ProjectData.ClearProjectError();
		}
	}

	private void MenuStrip1_ItemClicked(object sender, ToolStripItemClickedEventArgs e)
	{
	}

	private void PreferenciasToolStripMenuItem1_Click(object sender, EventArgs e)
	{
	}

	private void CambiarContraseñaToolStripMenuItem1_Click(object sender, EventArgs e)
	{
		MyProject.Forms.cambiarcontra.Show();
	}

	private void SalirToolStripMenuItem1_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void ManualDeUsuarioToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string startupPath = Application.StartupPath;
		try
		{
			Interaction.Shell("rundll32.exe url.dll,FileProtocolHandler " + startupPath + "\\Resources\\\\Manual Instalación y Uso INCLISOFT VEXT.pdf");
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			string newLine = Environment.NewLine;
			Interaction.MsgBox(RM.GetString("problema") + newLine + RM.GetString("acuda"));
			ProjectData.ClearProjectError();
		}
	}

	private void ManualDeInstalaciónToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string startupPath = Application.StartupPath;
		try
		{
			Interaction.Shell("rundll32.exe url.dll,FileProtocolHandler " + startupPath + "\\Resources\\\\Manual Instalación y Uso VEXT V2.pdf");
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			string newLine = Environment.NewLine;
			Interaction.MsgBox(RM.GetString("problema") + newLine + RM.GetString("acuda"));
			ProjectData.ClearProjectError();
		}
	}

	public Principal()
	{
		base.BindingContextChanged += Principal_BindingContextChanged;
		base.EnabledChanged += Principal_EnabledChanged;
		base.Load += Principal_Load;
		base.VisibleChanged += Principal_VisibleChanged;
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
		vehiculo_seleccionado = 0;
		ruta_raiz = "";
		ruta_nueva = "";
		user = 2;
		archivo_existente = false;
		num_archivos_existentes = 0;
		string name = MySettingsProperty.Settings.idioma;
		Thread.CurrentThread.CurrentCulture = new CultureInfo(name);
		Thread.CurrentThread.CurrentUICulture = new CultureInfo(name);
		InitializeComponent();
	}

	private void StoragePathToolStripMenuItem_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Preferencias.Show();
	}

	private void LanguageToolStripMenuItem_Click(object sender, EventArgs e)
	{
		MyProject.Forms.idioma.Show();
	}
}
